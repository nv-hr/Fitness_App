import { successResponse, errorResponse } from '../utils/response.js';
import { generateWeeklyPlan, getCachedPlan, setCachedPlan, clearCachedPlan, regenerateDay, swapActivity, isOldFormat } from '../services/llm.service.js';
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
        const migrated = await attemptMigration(userId, weekStart);
        if (migrated) {
          return successResponse(res, { plan: migrated, fromCache: false });
        }
        // D-03: LLM failure — fall through to return cached plan as-is
        console.warn(`[Migration] LLM failed for user ${userId}, week ${weekStart}. Returning cached old-format plan.`);
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
      const migrated = await attemptMigration(userId, weekStart);
      if (migrated) {
        return successResponse(res, { plan: migrated, fromCache: false });
      }
      // D-03: LLM failure — keep old format, try again next visit
      console.warn(`[Migration] LLM failed for user ${userId}, week ${weekStart}. Returning DB old-format plan.`);
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

    // Propagate availableDays from cached plan if available
    const cached = getCachedPlan(userId, targetWeekStart);
    if (cached && Array.isArray(cached.days)) {
      const activityDays = cached.days.filter(d => d.rest_day === false).length;
      if (activityDays > 0) deps.availableDays = activityDays;
    }

    // CR-03: Fall back to DB if plan not in cache (e.g., after server restart)
    if (!cached || !Array.isArray(cached.days)) {
      const dbPlan = await findByUserAndWeek(userId, targetWeekStart);
      if (dbPlan && dbPlan.plan_data && Array.isArray(dbPlan.plan_data.days)) {
        setCachedPlan(userId, targetWeekStart, dbPlan.plan_data);
      }
    }

    const result = await swapActivity(deps, activityId, dayIndex);

    // Persist to DB (cache is already updated inside swapActivity under the mutex)
    await upsertPlan(userId, targetWeekStart, result.plan, 'active');

    return successResponse(res, result);
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
      return null;
    }

    // Persist migrated plan to DB
    await upsertPlan(userId, weekStart, newPlan, 'active');
    console.log(`[Migration] Successfully migrated plan for user ${userId}, week ${weekStart}.`);

    return newPlan;
  } catch (err) {
    // D-03: LLM failure — keep old format, try again next visit
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
