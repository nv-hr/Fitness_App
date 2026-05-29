import { successResponse, errorResponse } from '../utils/response.js';
import { generateWeeklyPlan } from '../services/llm.service.js';
import { findByUserId as findProfileByUserId } from '../repositories/profile.repository.js';
import {
  getActivityHistoryWithEntries,
  getAllActivities,
  getTopActivities,
} from '../repositories/activity.repository.js';

async function generate(req, res, next) {
  try {
    const userId = req.user.userId;
    const weekStart = req.body.weekStart || getMonday(new Date());

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

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export default {
  generate,
};
