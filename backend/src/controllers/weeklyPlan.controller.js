import { successResponse, errorResponse } from '../utils/response.js';
import { generateWeeklyPlan, getCachedPlan, setCachedPlan, clearCachedPlan, regenerateDay, swapActivity, isOldFormat, acquireLock } from '../services/llm.service.js';
import { findByUserId as findProfileByUserId } from '../repositories/profile.repository.js';
import { pool } from '../config/database.js';
import { AppError } from '../utils/errors.js';
import {
  getActivityHistoryWithEntries,
  getAllActivities,
  getTopActivities,
  getRandomActivities,
  upsertActivityLogFromPlan,
  deleteActivityLogByPlan,
} from '../repositories/activity.repository.js';
import { findByUserAndWeek, upsertPlan, syncWeeklyPlanCompletedStates } from '../repositories/weeklyPlan.repository.js';

// CR-01: Migration failure cooldown — prevents infinite retry on every GET
// when LLM is unavailable. After a failed attempt, subsequent requests
// skip migration for a configurable window.
const migrationFailCooldown = new Map();
const MIGRATION_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

function isMigrationOnCooldown(userId, weekStart) {
  const key = `${userId}_${weekStart}`;
  const lastAttempt = migrationFailCooldown.get(key);
  if (!lastAttempt) return false;
  if (Date.now() - lastAttempt > MIGRATION_COOLDOWN_MS) {
    migrationFailCooldown.delete(key);
    return false;
  }
  return true;
}

// WR-02: Infer availableDays from an old-format plan's structure (best-effort).
// Counts non-empty activity days and clamps to [4, 6]; falls back to 5 if
// the old plan has no days array. This preserves the user's original plan
// structure rather than silently switching to a fixed 5-day default.
function inferAvailableDays(oldPlan) {
  if (!oldPlan?.days) return 5;
  const nonEmptyDays = oldPlan.days.filter(d => d.activities?.length > 0).length;
  return Math.max(4, Math.min(6, nonEmptyDays || 5));
}

function isValidDateString(str) {
  if (typeof str !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

function getMonday(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1;
  d.setUTCDate(d.getUTCDate() - day + diff);
  return d.toISOString().split('T')[0];
}

function isDateWithinTimezoneRange(dateStr) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  return dateStr === todayStr || dateStr === yesterdayStr || dateStr === tomorrowStr;
}

async function get(req, res, next) {
  try {
    const userId = req.user.userId;
    let weekStart = req.query.weekStart;

    if (weekStart && !isValidDateString(weekStart)) {
      return errorResponse(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR');
    }
    weekStart = getMonday(weekStart ? new Date(weekStart) : new Date());

    // Try in-memory cache first (faster, no DB hit)
    const cached = getCachedPlan(userId, weekStart);
    if (cached && cached.status !== 'fallback') {
      // D-01: Check for old-format plan in cache (defensive — migrated plans always
      // have format_version: 1, but old-format plans cached via swapHandler CR-03
      // would lack it).
      if (isOldFormat(cached)) {
        if (!isMigrationOnCooldown(userId, weekStart)) {
          const migrated = await attemptMigration(userId, weekStart);
          if (migrated) {
            return successResponse(res, { plan: migrated, fromCache: false });
          }
          // CR-01: Record failed migration to enforce cooldown
          migrationFailCooldown.set(`${userId}_${weekStart}`, Date.now());
        }
        // D-03 / CR-06: Return cached plan as-is — do NOT fall through to DB path,
        // which would trigger a second migration attempt on the same request.
        console.warn(`[Migration] LLM failed or cooldown active for user ${userId}, week ${weekStart}. Returning cached old-format plan.`);
      }
      return successResponse(res, { plan: cached, fromCache: true });
    }

    // Fall back to DB
    const { rows } = await pool.query(
      `SELECT plan_data, status, created_at, updated_at
       FROM weekly_plans
       WHERE user_id = $1 AND week_start = $2
       LIMIT 1`,
      [userId, weekStart]
    );

    if (rows.length === 0) {
      return successResponse(res, { plan: null, fromCache: false });
    }

    const row = rows[0];

    // D-01: Lazy migration — detect old format by absence of format_version
    // If the DB plan_data lacks format_version, trigger silent regeneration.
    if (row.plan_data && isOldFormat(row.plan_data)) {
      if (!isMigrationOnCooldown(userId, weekStart)) {
        const migrated = await attemptMigration(userId, weekStart);
        if (migrated) {
          return successResponse(res, { plan: migrated, fromCache: false });
        }
        // CR-01: Record failed migration to enforce cooldown
        migrationFailCooldown.set(`${userId}_${weekStart}`, Date.now());
      }
      // D-03: LLM failure — keep old format, try again after cooldown expires
      console.warn(`[Migration] LLM failed or cooldown active for user ${userId}, week ${weekStart}. Returning DB old-format plan.`);
    }

    const plan = {
      days: row.plan_data?.days || [],
      status: row.status || 'active',
      generated_at: row.plan_data?.generated_at || row.created_at,
    };

    const syncedPlan = await syncWeeklyPlanCompletedStates(userId, weekStart, plan);
    setCachedPlan(userId, weekStart, syncedPlan);
    return successResponse(res, { plan: syncedPlan, fromCache: false });
  } catch (err) {
    next(err);
  }
}

async function generate(req, res, next) {
  try {
    const userId = req.user.userId;
    let weekStart = req.body.weekStart;

    if (weekStart && !isValidDateString(weekStart)) {
      return errorResponse(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR');
    }
    weekStart = getMonday(weekStart ? new Date(weekStart) : new Date());

    // Extract and validate availableDays (4-6 range, default 4)
    let availableDays = req.body.availableDays;
    if (availableDays !== undefined && availableDays !== null) {
      if (!Number.isInteger(availableDays) || availableDays < 4 || availableDays > 6) {
        return errorResponse(res, 'availableDays must be an integer between 4 and 6', 400, 'VALIDATION_ERROR');
      }
    } else {
      availableDays = 4; // default
    }

    // Check DB for existing plan before regenerating (cache was wiped on restart)
    const existingPlan = await findByUserAndWeek(userId, weekStart);
    if (existingPlan && existingPlan.plan_data && Array.isArray(existingPlan.plan_data.days) && !isOldFormat(existingPlan.plan_data)) {
      setCachedPlan(userId, weekStart, existingPlan.plan_data);
      return successResponse(res, { plan: existingPlan.plan_data, fromCache: false });
    }

    const result = await generateWeeklyPlan({
      getProfile: (id) => findProfileByUserId(id),
      getActivityHistory: (id, days) => getActivityHistoryWithEntries(id, days),
      getActivities: () => getAllActivities(),
      getTopActivities: (id, limit) => getTopActivities(id, limit),
      userId,
      weekStart,
      availableDays, // pass through to service
    });

    // Persist to DB so toggleComplete, swapHandler, and subsequent
    // page loads can find the plan (generateWeeklyPlan only caches in memory).
    if (result.plan && Array.isArray(result.plan.days)) {
      await upsertPlan(userId, weekStart, result.plan, result.status || 'active');
    }

    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

async function regenerateDayHandler(req, res, next) {
  try {
    const userId = req.user.userId;
    const { weekStart, dayIndex, availableDays } = req.body;

    if (typeof dayIndex !== 'number' || dayIndex < 0 || dayIndex > 6) {
      return errorResponse(res, 'dayIndex must be a number between 0 and 6', 400, 'VALIDATION_ERROR');
    }

    let targetWeekStart = weekStart;
    if (targetWeekStart && !isValidDateString(targetWeekStart)) {
      return errorResponse(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR');
    }
    targetWeekStart = getMonday(targetWeekStart ? new Date(targetWeekStart) : new Date());

    const deps = {
      getProfile: (id) => findProfileByUserId(id),
      getActivityHistory: (id, days) => getActivityHistoryWithEntries(id, days),
      getActivities: () => getAllActivities(),
      getTopActivities: (id, limit) => getTopActivities(id, limit),
      userId,
      weekStart: targetWeekStart,
    };
    if (availableDays !== undefined && availableDays !== null) {
      if (!Number.isInteger(availableDays) || availableDays < 4 || availableDays > 6) {
        return errorResponse(res, 'availableDays must be an integer between 4 and 6', 400, 'VALIDATION_ERROR');
      }
      deps.availableDays = availableDays;
    }

    const result = await regenerateDay(deps, dayIndex);

    if (result.plan && Array.isArray(result.plan.days)) {
      await upsertPlan(userId, targetWeekStart, result.plan, result.status || 'active');
    }

    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

async function swapHandler(req, res, next) {
  try {
    const userId = req.user.userId;
    const { activityId, dayIndex, weekStart } = req.body;

    // Validate activityId
    if (activityId === undefined || activityId === null) {
      return errorResponse(res, 'activityId is required', 400, 'VALIDATION_ERROR');
    }
    if (typeof activityId !== 'number' || activityId < 1) {
      return errorResponse(res, 'activityId must be a positive integer', 400, 'VALIDATION_ERROR');
    }

    // Validate dayIndex
    if (typeof dayIndex !== 'number' || dayIndex < 0 || dayIndex > 6) {
      return errorResponse(res, 'dayIndex must be a number between 0 and 6', 400, 'VALIDATION_ERROR');
    }

    // Validate and normalize weekStart
    let targetWeekStart = weekStart;
    if (targetWeekStart && !isValidDateString(targetWeekStart)) {
      return errorResponse(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR');
    }
    targetWeekStart = getMonday(targetWeekStart ? new Date(targetWeekStart) : new Date());

    const dayDate = getMonday(new Date());
    const dayOffset = dayIndex;
    const targetDate = new Date(dayDate);
    targetDate.setDate(targetDate.getDate() + dayOffset);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    if (!isDateWithinTimezoneRange(targetDateStr)) {
      return errorResponse(res, 'Can only swap activities for today (considering timezone differences)', 400, 'VALIDATION_ERROR');
    }

    // CR-02: Acquire per-user lock to make the entire migration+swap sequence atomic.
    // This prevents concurrent swap requests from racing on cache/DB state.
    const lockKey = `swap_${userId}_${targetWeekStart}`;
    const release = await acquireLock(lockKey);
    try {
      // D-04 + CR-03: Load plan from cache or DB, migrate if old format
      let planForSwap = getCachedPlan(userId, targetWeekStart);
      if (!planForSwap || !Array.isArray(planForSwap.days)) {
        const dbPlan = await findByUserAndWeek(userId, targetWeekStart);
        if (dbPlan && dbPlan.plan_data && Array.isArray(dbPlan.plan_data.days)) {
          planForSwap = dbPlan.plan_data;
          setCachedPlan(userId, targetWeekStart, planForSwap);
        }
      }

      // Assemble deps for swapActivity
      const deps = {
        getProfile: (id) => findProfileByUserId(id),
        getActivityHistory: (id, days) => getActivityHistoryWithEntries(id, days),
        getActivities: () => getAllActivities(),
        getTopActivities: (id, limit) => getTopActivities(id, limit),
        getRandomActivity: (tags) => getRandomActivities(tags, 1),
        userId,
        weekStart: targetWeekStart,
      };

      // D-04: Auto-trigger migration if plan is old format, then retry swap
      if (planForSwap && isOldFormat(planForSwap)) {
        console.log(`[Migration] Old-format plan detected during swap for user ${userId}, week ${targetWeekStart}. Migrating...`);
        clearCachedPlan(userId, targetWeekStart);
        // WR-02: Infer availableDays from the old plan's structure rather than hardcoding 5
        const inferredDays = inferAvailableDays(planForSwap);
        const migrationDeps = {
          getProfile: (id) => findProfileByUserId(id),
          getActivityHistory: (id, days) => getActivityHistoryWithEntries(id, days),
          getActivities: () => getAllActivities(),
          getTopActivities: (id, limit) => getTopActivities(id, limit),
          userId,
          weekStart: targetWeekStart,
          availableDays: inferredDays,
        };
        console.log(`[Migration] Using inferred availableDays=${inferredDays} from old plan (${planForSwap.days?.length || 0} total days, ${planForSwap.days?.filter(d => d.activities?.length > 0).length || 0} activity days).`);
        const migrationResult = await generateWeeklyPlan(migrationDeps);
        if (!migrationResult.plan || !Array.isArray(migrationResult.plan.days) || migrationResult.plan.days.length === 0) {
          migrationFailCooldown.set(`${userId}_${targetWeekStart}`, Date.now());
          throw new AppError('MigrationError', 'Failed to migrate old-format plan. Cannot proceed with swap.', 500);
        }
        // Persist migrated plan to DB and cache
        await upsertPlan(userId, targetWeekStart, migrationResult.plan, 'active');
        console.log(`[Migration] Successfully migrated plan for swap. Proceeding with swap.`);
      }

      // Re-read availableDays from (now potentially migrated) cached plan
      const updatedCached = getCachedPlan(userId, targetWeekStart);
      if (updatedCached && Array.isArray(updatedCached.days)) {
        const activityDays = updatedCached.days.filter(d => d.rest_day === false).length;
        if (activityDays > 0) deps.availableDays = activityDays;
      }

      // CR-02: Pass skipLock=true because we already hold the lock
      const result = await swapActivity(deps, activityId, dayIndex, true);

      // Persist to DB (cache is already updated inside swapActivity under the mutex)
      await upsertPlan(userId, targetWeekStart, result.plan, 'active');

      return successResponse(res, result);
    } finally {
      release();
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Attempt to migrate an old-format plan to the new variable-day format.
 * D-01: Triggers on GET request (lazy regeneration).
 * D-03: On LLM failure, returns null — caller keeps old format.
 * D-02: Transparent — no extra response fields, no notification.
 *
 * @param {number} userId
 * @param {string} weekStart - ISO date string
 * @returns {Promise<object|null>} Migrated plan or null on failure
 */
async function attemptMigration(userId, weekStart) {
  // CR-01: Check cooldown before attempting migration
  if (isMigrationOnCooldown(userId, weekStart)) {
    console.warn(`[Migration] Cooldown active for user ${userId}, week ${weekStart}. Skipping migration.`);
    return null;
  }

  console.log(`[Migration] Old-format plan detected for user ${userId}, week ${weekStart}. Regenerating...`);

  // Clear cache to force fresh LLM call (D-04: prevents generateWeeklyPlan
  // from returning a stale cached old-format plan)
  clearCachedPlan(userId, weekStart);

  // WR-02: Infer availableDays from the old plan structure rather than hardcoding 5.
  // The old plan was cleared from cache above, so re-read from DB for inference.
  // If DB read fails or returns no data, fall back to default of 5.
  let inferredDays = 5;
  try {
    const dbPlan = await findByUserAndWeek(userId, weekStart);
    inferredDays = inferAvailableDays(dbPlan?.plan_data || null);
  } catch {
    // DB read failure is non-fatal — use default
  }
  console.log(`[Migration] Using inferred availableDays=${inferredDays} for user ${userId}, week ${weekStart}.`);

  const deps = {
    getProfile: (id) => findProfileByUserId(id),
    getActivityHistory: (id, days) => getActivityHistoryWithEntries(id, days),
    getActivities: () => getAllActivities(),
    getTopActivities: (id, limit) => getTopActivities(id, limit),
    userId,
    weekStart,
    availableDays: inferredDays,
  };

  try {
    const result = await generateWeeklyPlan(deps);
    const newPlan = result.plan;

    // Validate the generated plan has minimum required structure
    if (!newPlan || !Array.isArray(newPlan.days) || newPlan.days.length === 0) {
      console.warn(`[Migration] Regeneration produced invalid plan (days: ${newPlan?.days?.length || 0}). Keeping old format.`);
      migrationFailCooldown.set(`${userId}_${weekStart}`, Date.now());
      return null;
    }

    // Persist migrated plan to DB
    await upsertPlan(userId, weekStart, newPlan, 'active');
    console.log(`[Migration] Successfully migrated plan for user ${userId}, week ${weekStart}.`);

    return newPlan;
  } catch (err) {
    // D-03: LLM failure — keep old format, try again after cooldown
    migrationFailCooldown.set(`${userId}_${weekStart}`, Date.now());
    console.error(`[Migration] Failed: ${err.message}. Keeping old format for user ${userId}.`);
    return null;
  }
}

async function toggleComplete(req, res, next) {
  try {
    const userId = req.user.userId;
    const { weekStart, dayIndex, activityId, completed } = req.body;

    // Validate weekStart
    if (!weekStart || !isValidDateString(weekStart)) {
      return errorResponse(res, 'Invalid or missing weekStart date', 400, 'VALIDATION_ERROR');
    }

    // Validate dayIndex
    if (typeof dayIndex !== 'number' || dayIndex < 0 || dayIndex > 6) {
      return errorResponse(res, 'dayIndex must be a number between 0 and 6', 400, 'VALIDATION_ERROR');
    }

    // Validate activityId
    if (activityId === undefined || activityId === null) {
      return errorResponse(res, 'activityId is required', 400, 'VALIDATION_ERROR');
    }

    // Validate completed is boolean (WR-05)
    if (typeof completed !== 'boolean') {
      return errorResponse(res, 'completed must be a boolean', 400, 'VALIDATION_ERROR');
    }

    // Normalize weekStart
    const targetWeekStart = getMonday(weekStart ? new Date(weekStart) : new Date());

    // Check cache first (fast path — plan may have been generated this session)
    let planData = getCachedPlan(userId, targetWeekStart);
    let planStatus = 'active';

    // Fall back to DB if not in cache
    if (!planData || !Array.isArray(planData.days)) {
      const dbPlan = await findByUserAndWeek(userId, targetWeekStart);
      if (!dbPlan || !dbPlan.plan_data || !Array.isArray(dbPlan.plan_data.days)) {
        return errorResponse(res, 'No plan found for the given week', 404, 'NOT_FOUND');
      }
      planData = dbPlan.plan_data;
      planStatus = dbPlan.status || 'active';
    }

    // Locate the day in the plan
    if (!planData.days[dayIndex]) {
      return errorResponse(res, 'Day index not found in plan', 400, 'VALIDATION_ERROR');
    }

    const day = planData.days[dayIndex];
    if (!Array.isArray(day.activities)) {
      return errorResponse(res, 'No activities found for this day', 400, 'VALIDATION_ERROR');
    }

    // Find and toggle the activity
    const activityIdx = day.activities.findIndex(a => a.activity_id === activityId);
    if (activityIdx === -1) {
      return errorResponse(res, 'Activity not found in plan day', 404, 'NOT_FOUND');
    }

    if (!isDateWithinTimezoneRange(day.date)) {
      return errorResponse(res, 'Can only toggle activities for today (considering timezone differences)', 400, 'VALIDATION_ERROR');
    }

    // Set the completed flag
    day.activities[activityIdx].completed = completed === true;

    // Recompute day-level completed flag
    const allCompleted = day.activities.length > 0 && day.activities.every(a => a.completed === true);
    day.completed = allCompleted;
    if (!allCompleted) delete day.completed; // Clean up �?" only set when fully completed

    // Persist the updated plan
    await upsertPlan(userId, targetWeekStart, planData, planStatus);

    // Sync activity_log table for history visibility
    try {
      if (completed) {
        const act = day.activities[activityIdx];
        await upsertActivityLogFromPlan(userId, {
          activityId,
          durationMin: act.duration_min,
          intensity: act.intensity || 'moderate',
          caloriesBurned: Math.max(0, Math.round(act.calories_burned || 0)),
          loggedDate: day.date,
        });
      } else {
        const act = day.activities[activityIdx];
        await deleteActivityLogByPlan(userId, activityId, day.date, act.duration_min);
      }
    } catch (logErr) {
      console.warn(`[ToggleComplete] Failed to sync activity_log: ${logErr.message}`);
    }

    // Update cache
    setCachedPlan(userId, targetWeekStart, planData);

    return successResponse(res, { plan: planData });
  } catch (err) {
    next(err);
  }
}

async function generateStream(req, res, next) {
  const userId = req.user.userId;
  let weekStart = req.body.weekStart;

  if (weekStart && !isValidDateString(weekStart)) {
    return errorResponse(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR');
  }
  weekStart = getMonday(weekStart ? new Date(weekStart) : new Date());

  let availableDays = req.body.availableDays;
  if (availableDays !== undefined && availableDays !== null) {
    if (!Number.isInteger(availableDays) || availableDays < 4 || availableDays > 6) {
      return errorResponse(res, 'availableDays must be an integer between 4 and 6', 400, 'VALIDATION_ERROR');
    }
  } else {
    availableDays = 4;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const onChunk = (chunk) => {
    res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
  };

  try {
    const existingPlan = await findByUserAndWeek(userId, weekStart);
    if (existingPlan && existingPlan.plan_data && Array.isArray(existingPlan.plan_data.days) && !isOldFormat(existingPlan.plan_data)) {
      setCachedPlan(userId, weekStart, existingPlan.plan_data);
      res.write(`data: ${JSON.stringify({ type: 'done', plan: existingPlan.plan_data })}\n\n`);
      res.end();
      return;
    }

    const result = await generateWeeklyPlan({
      getProfile: (id) => findProfileByUserId(id),
      getActivityHistory: (id, days) => getActivityHistoryWithEntries(id, days),
      getActivities: () => getAllActivities(),
      getTopActivities: (id, limit) => getTopActivities(id, limit),
      userId,
      weekStart,
      availableDays,
      onChunk,
    });

    if (result.plan && Array.isArray(result.plan.days)) {
      await upsertPlan(userId, weekStart, result.plan, result.status || 'active');
    }

    res.write(`data: ${JSON.stringify({ type: 'done', plan: result.plan })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  }
}

async function regenerateDayStream(req, res, next) {
  const userId = req.user.userId;
  const { weekStart, dayIndex, availableDays } = req.body;

  if (typeof dayIndex !== 'number' || dayIndex < 0 || dayIndex > 6) {
    return errorResponse(res, 'dayIndex must be a number between 0 and 6', 400, 'VALIDATION_ERROR');
  }

  let targetWeekStart = weekStart;
  if (targetWeekStart && !isValidDateString(targetWeekStart)) {
    return errorResponse(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR');
  }
  targetWeekStart = getMonday(targetWeekStart ? new Date(targetWeekStart) : new Date());

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const onChunk = (chunk) => {
    res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
  };

  try {
    const deps = {
      getProfile: (id) => findProfileByUserId(id),
      getActivityHistory: (id, days) => getActivityHistoryWithEntries(id, days),
      getActivities: () => getAllActivities(),
      getTopActivities: (id, limit) => getTopActivities(id, limit),
      userId,
      weekStart: targetWeekStart,
      onChunk,
    };
    if (availableDays !== undefined && availableDays !== null) {
      if (!Number.isInteger(availableDays) || availableDays < 4 || availableDays > 6) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'availableDays must be an integer between 4 and 6' })}\n\n`);
        res.end();
        return;
      }
      deps.availableDays = availableDays;
    }

    const result = await regenerateDay(deps, dayIndex);

    if (result.plan && Array.isArray(result.plan.days)) {
      await upsertPlan(userId, targetWeekStart, result.plan, result.status || 'active');
    }

    res.write(`data: ${JSON.stringify({ type: 'done', plan: result.plan })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  }
}

async function swapStream(req, res, next) {
  const userId = req.user.userId;
  const { activityId, dayIndex, weekStart } = req.body;

  if (activityId === undefined || activityId === null) {
    return errorResponse(res, 'activityId is required', 400, 'VALIDATION_ERROR');
  }
  if (typeof activityId !== 'number' || activityId < 1) {
    return errorResponse(res, 'activityId must be a positive integer', 400, 'VALIDATION_ERROR');
  }
  if (typeof dayIndex !== 'number' || dayIndex < 0 || dayIndex > 6) {
    return errorResponse(res, 'dayIndex must be a number between 0 and 6', 400, 'VALIDATION_ERROR');
  }

  let targetWeekStart = weekStart;
  if (targetWeekStart && !isValidDateString(targetWeekStart)) {
    return errorResponse(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR');
  }
  targetWeekStart = getMonday(targetWeekStart ? new Date(targetWeekStart) : new Date());

  const dayDate = getMonday(new Date());
  const dayOffset = dayIndex;
  const targetDate = new Date(dayDate);
  targetDate.setDate(targetDate.getDate() + dayOffset);
  const targetDateStr = targetDate.toISOString().split('T')[0];
  if (!isDateWithinTimezoneRange(targetDateStr)) {
    return errorResponse(res, 'Can only swap activities for today (considering timezone differences)', 400, 'VALIDATION_ERROR');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const onChunk = (chunk) => {
    res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
  };

  const lockKey = `swap_${userId}_${targetWeekStart}`;
  const release = await acquireLock(lockKey);
  try {
    let planForSwap = getCachedPlan(userId, targetWeekStart);
    if (!planForSwap || !Array.isArray(planForSwap.days)) {
      const dbPlan = await findByUserAndWeek(userId, targetWeekStart);
      if (dbPlan && dbPlan.plan_data && Array.isArray(dbPlan.plan_data.days)) {
        planForSwap = dbPlan.plan_data;
        setCachedPlan(userId, targetWeekStart, planForSwap);
      }
    }

    const deps = {
      getProfile: (id) => findProfileByUserId(id),
      getActivityHistory: (id, days) => getActivityHistoryWithEntries(id, days),
      getActivities: () => getAllActivities(),
      getTopActivities: (id, limit) => getTopActivities(id, limit),
      getRandomActivity: (tags) => getRandomActivities(tags, 1),
      userId,
      weekStart: targetWeekStart,
      onChunk,
    };

    if (planForSwap && isOldFormat(planForSwap)) {
      clearCachedPlan(userId, targetWeekStart);
      const inferredDays = inferAvailableDays(planForSwap);
      const migrationDeps = {
        getProfile: (id) => findProfileByUserId(id),
        getActivityHistory: (id, days) => getActivityHistoryWithEntries(id, days),
        getActivities: () => getAllActivities(),
        getTopActivities: (id, limit) => getTopActivities(id, limit),
        userId,
        weekStart: targetWeekStart,
        availableDays: inferredDays,
        onChunk,
      };
      const migrationResult = await generateWeeklyPlan(migrationDeps);
      if (!migrationResult.plan || !Array.isArray(migrationResult.plan.days) || migrationResult.plan.days.length === 0) {
        migrationFailCooldown.set(`${userId}_${targetWeekStart}`, Date.now());
        throw new AppError('MigrationError', 'Failed to migrate old-format plan. Cannot proceed with swap.', 500);
      }
      await upsertPlan(userId, targetWeekStart, migrationResult.plan, 'active');
    }

    const updatedCached = getCachedPlan(userId, targetWeekStart);
    if (updatedCached && Array.isArray(updatedCached.days)) {
      const activityDays = updatedCached.days.filter(d => d.rest_day === false).length;
      if (activityDays > 0) deps.availableDays = activityDays;
    }

    const result = await swapActivity(deps, activityId, dayIndex, true);
    await upsertPlan(userId, targetWeekStart, result.plan, 'active');

    res.write(`data: ${JSON.stringify({ type: 'done', plan: result.plan })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  } finally {
    release();
  }
}

export default {
  get,
  generate,
  regenerateDay: regenerateDayHandler,
  swap: swapHandler,
  toggleComplete,
  generateStream,
  regenerateDayStream,
  swapStream,
};
