import { AppError } from '../utils/errors.js';
import { findPlanByUserAndDate, upsertPlanBase } from './basePlan.repository.js';

export async function findByUserAndDate(userId, planDate, clientOverride) {
  return findPlanByUserAndDate('activity_plans', userId, planDate, clientOverride);
}

export async function upsertPlan(userId, planDate, planData, status = 'active', clientOverride) {
  return upsertPlanBase('activity_plans', userId, planDate, planData, status, clientOverride);
}

export async function markActivitiesLogged(userId, planDate, activityIndexes, clientOverride) {
  try {
    const plan = await findByUserAndDate(userId, planDate, clientOverride);
    if (!plan) return null;
    const data = plan.plan_data;
    if (!Array.isArray(data.activities)) return null;
    for (const idx of activityIndexes) {
      if (data.activities[idx]) {
        data.activities[idx].logged = true;
      }
    }
    return upsertPlan(userId, planDate, data, plan.status, clientOverride);
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to mark activities logged: ${err.message}`, 500);
  }
}
