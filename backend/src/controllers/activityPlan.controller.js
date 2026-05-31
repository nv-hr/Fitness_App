import { successResponse, errorResponse } from '../utils/response.js';
import { getCachedPlan } from '../services/llm.service.js';
import { generateActivityPlan } from '../services/activityPlan.service.js';
import { getProfile } from '../services/profile.service.js';
import { getAllActivities, getActivityHistoryWithEntries } from '../repositories/activity.repository.js';
import { findByUserAndDate } from '../repositories/activityPlan.repository.js';

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

export default {
  get,
  generate,
};
