import { pool } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { getCachedPlan } from '../services/llm.service.js';
import { generateActivityPlan } from '../services/activityPlan.service.js';
import { getProfile } from '../services/profile.service.js';
import { getAllActivities, getActivityHistoryWithEntries, batchLogActivities } from '../repositories/activity.repository.js';
import { findByUserAndDate, markActivitiesLogged } from '../repositories/activityPlan.repository.js';

function isValidDateString(str) {
  if (typeof str !== 'string') return false;
  const d = new Date(str + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

async function get(req, res, next) {
  try {
    const userId = req.user.userId;
    let planDate = req.query.date;
    if (planDate && !isValidDateString(planDate)) {
      return errorResponse(res, 'Invalid date format (use YYYY-MM-DD)', 400, 'VALIDATION_ERROR');
    }
    planDate = planDate || getTodayString();
    const cached = getCachedPlan(userId, planDate, 'activity');
    if (cached && cached.status !== 'fallback') {
      return successResponse(res, { plan: cached, fromCache: true });
    }
    const dbPlan = await findByUserAndDate(userId, planDate);
    if (!dbPlan) {
      return successResponse(res, { plan: null, fromCache: false });
    }
    return successResponse(res, { plan: dbPlan.plan_data, fromCache: false });
  } catch (err) {
    next(err);
  }
}

async function generate(req, res, next) {
  try {
    const userId = req.user.userId;
    let planDate = req.body.date;
    if (planDate && !isValidDateString(planDate)) {
      return errorResponse(res, 'Invalid date format (use YYYY-MM-DD)', 400, 'VALIDATION_ERROR');
    }
    planDate = planDate || getTodayString();
    const result = await generateActivityPlan({
      getProfile: (id) => getProfile(id),
      getAllActivities: (id) => getAllActivities(),
      getActivityHistory: (id, days) => getActivityHistoryWithEntries(id, days),
      userId,
      planDate,
    });
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

async function logActivities(req, res, next) {
  try {
    const userId = req.user.userId;
    const { date, activityIndexes } = req.body;
    if (date && !isValidDateString(date)) {
      return errorResponse(res, 'Invalid date format (use YYYY-MM-DD)', 400, 'VALIDATION_ERROR');
    }
    const planDate = date || getTodayString();
    if (!Array.isArray(activityIndexes) || activityIndexes.length === 0) {
      return errorResponse(res, 'activityIndexes must be a non-empty array', 400, 'VALIDATION_ERROR');
    }
    const plan = await findByUserAndDate(userId, planDate);
    if (!plan) {
      return errorResponse(res, 'No activity plan found for the given date', 404, 'NOT_FOUND');
    }
    const data = plan.plan_data;
    if (!data.activities || !Array.isArray(data.activities)) {
      return errorResponse(res, 'No activities found in plan', 404, 'NOT_FOUND');
    }
    const items = [];
    for (const idx of activityIndexes) {
      const act = data.activities[idx];
      if (!act) {
        return errorResponse(res, `Activity index ${idx} not found in plan`, 400, 'VALIDATION_ERROR');
      }
      if (act.logged) continue;
      items.push({
        activityId: act.activity_id,
        durationMin: act.duration_min,
        intensity: act.intensity,
        caloriesBurned: act.calories_burned || 0,
        loggedDate: planDate,
      });
    }
    if (items.length === 0) {
      return successResponse(res, { logged: 0, message: 'All selected activities already logged.' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await batchLogActivities(userId, items, client);
      await markActivitiesLogged(userId, planDate, activityIndexes, client);
      await client.query('COMMIT');
      return successResponse(res, { logged: inserted.length, activities: inserted });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

export default {
  get,
  generate,
  logActivities,
};
