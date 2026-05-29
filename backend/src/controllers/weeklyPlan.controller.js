import { successResponse, errorResponse } from '../utils/response.js';
import { generateWeeklyPlan } from '../services/llm.service.js';
import { findByUserId as findProfileByUserId } from '../repositories/profile.repository.js';
import {
  getActivityHistoryWithEntries,
  getAllActivities,
  getTopActivities,
} from '../repositories/activity.repository.js';

function isValidDateString(str) {
  if (typeof str !== 'string') return false;
  const d = new Date(str + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().split('T')[0];
}

async function generate(req, res, next) {
  try {
    const userId = req.user.userId;
    let weekStart = req.body.weekStart;

    if (weekStart && !isValidDateString(weekStart)) {
      return errorResponse(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR');
    }
    weekStart = getMonday(weekStart ? new Date(weekStart) : new Date());

    const result = await generateWeeklyPlan({
      getProfile: (id) => findProfileByUserId(id),
      getActivityHistory: (id, days) => getActivityHistoryWithEntries(id, days),
      getActivities: () => getAllActivities(),
      getTopActivities: (id, limit) => getTopActivities(id, limit),
      userId,
      weekStart,
    });

    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

export default {
  generate,
};
