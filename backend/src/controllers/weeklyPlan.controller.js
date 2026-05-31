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
} from '../repositories/activity.repository.js';
import { findByUserAndWeek, upsertPlan } from '../repositories/weeklyPlan.repository.js';

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
  const d = new Date(str + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

function getMonday(date) {
  const d = new Date(date);
  const localDay = d.getDay();
  const diff = d.getDate() - localDay + (localDay === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
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

    return successResponse(res, { plan, fromCache: false });
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

    const result = await generateWeeklyPlan({
      getProfile: (id) => findProfileByUserId(id),
      getActivityHistory: (id, days) => getActivityHistoryWithEntries(id, days),
      getActivities: () => getAllActivities(),
      getTopActivities: (id, limit) => getTopActivities(id, limit),
      userId,
      weekStart,
      availableDays, // pass through to service
    });

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

  const deps = {
    getProfile: (id) => findProfileByUserId(id),
    getActivityHistory: (id, days) => getActivityHistoryWithEntries(id, days),
    getActivities: () => getAllActivities(),
    getTopActivities: (id, limit) => getTopActivities(id, limit),
    userId,
    weekStart,
    availableDays: 5, // default for migrated plans (CONTEXT.md discretion)
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

export default {
  get,
  generate,
  regenerateDay: regenerateDayHandler,
  swap: swapHandler,
};
