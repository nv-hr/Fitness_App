import { successResponse, errorResponse } from '../utils/response.js';
import { generateWeeklyPlan, getCachedPlan, regenerateDay, swapActivity } from '../services/llm.service.js';
import { findByUserId as findProfileByUserId } from '../repositories/profile.repository.js';
import { pool } from '../config/database.js';
import { AppError } from '../utils/errors.js';
import {
  getActivityHistoryWithEntries,
  getAllActivities,
  getTopActivities,
  getRandomActivities,
} from '../repositories/activity.repository.js';
import { upsertPlan } from '../repositories/weeklyPlan.repository.js';

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
    if (activityId === undefined || activityId === null || typeof activityId !== 'number' || activityId < 1) {
      return errorResponse(res, 'Activity not found in current plan', 400, 'VALIDATION_ERROR');
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

    const result = await swapActivity(deps, activityId, dayIndex);

    // Persist to DB (dual-write: cache + DB)
    await upsertPlan(userId, targetWeekStart, result.plan, 'active');

    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

export default {
  get,
  generate,
  regenerateDay: regenerateDayHandler,
  swap: swapHandler,
};
