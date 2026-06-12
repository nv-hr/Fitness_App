import { AppError } from '../utils/errors.js';
import { findPlanByUserAndDate, upsertPlanBase } from './basePlan.repository.js';

export async function findByUserAndDate(userId, planDate, clientOverride, forUpdate = false) {
  return findPlanByUserAndDate('daily_meal_plans', userId, planDate, clientOverride, forUpdate);
}

export async function upsertPlan(userId, planDate, planData, status = 'active', clientOverride) {
  return upsertPlanBase('daily_meal_plans', userId, planDate, planData, status, clientOverride);
}

export async function markItemLogged(userId, planDate, mealType, foodId, logged, clientOverride) {
  try {
    const plan = await findByUserAndDate(userId, planDate, clientOverride, true);
    if (!plan) return null;
    const data = plan.plan_data;
    if (!Array.isArray(data.meals)) return null;
    for (const meal of data.meals) {
      if (meal.meal_type !== mealType) continue;
      if (!Array.isArray(meal.items)) continue;
      for (const item of meal.items) {
        if (item.food_id === foodId) {
          item.logged = logged === true;
        }
      }
    }
    return upsertPlan(userId, planDate, data, plan.status, clientOverride);
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to mark item logged: ${err.message}`, 500);
  }
}

export async function markMealsLogged(userId, planDate, mealTypes, clientOverride) {
  try {
    const plan = await findByUserAndDate(userId, planDate, clientOverride, true);
    if (!plan) return null;
    const data = plan.plan_data;
    if (!Array.isArray(data.meals)) return null;
    for (const meal of data.meals) {
      if (mealTypes && !mealTypes.includes(meal.meal_type)) continue;
      if (!Array.isArray(meal.items)) continue;
      for (const item of meal.items) {
        item.logged = true;
      }
    }
    return upsertPlan(userId, planDate, data, plan.status, clientOverride);
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to mark meals logged: ${err.message}`, 500);
  }
}
