import { pool } from '../config/database.js';
import { AppError } from '../utils/errors.js';
import { findByUserAndDate, upsertPlan } from './dailyMealPlan.repository.js';

/**
 * Synchronizes the logged state of a planned food item.
 * Why: Ensures that plan items are only marked as logged if there is a matching log entry
 * with the exact portion size (weight) and meal type (time), preventing logs with different
 * weights or times from incorrectly checking/completing planned items.
 */
export async function syncItemLoggedState(userId, planDate, mealType, foodId, clientOverride) {
  const db = clientOverride || pool;
  try {
    const { rows } = await db.query(
      `SELECT COALESCE(SUM(portion_grams), 0) as total_logged
       FROM food_logs
       WHERE user_id = $1 AND log_date = $2 AND meal_type = $3 AND food_id = $4`,
      [userId, planDate, mealType, foodId]
    );
    const totalLogged = Number(rows[0].total_logged);

    const plan = await findByUserAndDate(userId, planDate, clientOverride, true);
    if (!plan) return null;
    const data = plan.plan_data;
    if (!Array.isArray(data.meals)) return null;

    let updated = false;
    for (const meal of data.meals) {
      if (meal.meal_type !== mealType) continue;
      if (!Array.isArray(meal.items)) continue;
      for (const item of meal.items) {
        if (item.food_id === foodId) {
          // Check if total logged grams is >= planned portion_grams
          const shouldBeLogged = totalLogged >= Number(item.portion_grams);
          if (item.logged !== shouldBeLogged) {
            item.logged = shouldBeLogged;
            updated = true;
          }
        }
      }
    }
    if (!updated) return null;
    return upsertPlan(userId, planDate, data, plan.status, clientOverride);
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to sync item logged state: ${err.message}`, 500);
  }
}

/**
 * Dynamically synchronizes and updates the logged flags for all food items in a meal plan
 * based on actual logged food entries in the database.
 * Why: Ensures UI checkboxes reflect true food logs by matching exact weights and meal times,
 * so logs of different weights or times do not mark plan items as logged.
 * @param {number} userId - User ID
 * @param {string} planDate - Date string
 * @param {Object} planData - Plan JSON data
 * @param {Object} [clientOverride] - Client override for transaction
 * @returns {Promise<Object>} Updated plan data
 */
export async function syncMealPlanLoggedStates(userId, planDate, planData, clientOverride) {
  const db = clientOverride || pool;
  try {
    if (!planData || !Array.isArray(planData.meals)) return planData;

    let changed = false;
    for (const meal of planData.meals) {
      if (!Array.isArray(meal.items)) continue;
      for (const item of meal.items) {
        if (item.food_id) {
          const { rows } = await db.query(
            `SELECT COALESCE(SUM(portion_grams), 0) as total_logged
             FROM food_logs
             WHERE user_id = $1 AND log_date = $2 AND meal_type = $3 AND food_id = $4`,
            [userId, planDate, meal.meal_type, item.food_id]
          );
          const totalLogged = Number(rows[0].total_logged);
          const shouldBeLogged = totalLogged >= Number(item.portion_grams);
          if (item.logged !== shouldBeLogged) {
            item.logged = shouldBeLogged;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      const planRow = await findByUserAndDate(userId, planDate, clientOverride);
      const status = planRow ? planRow.status : 'active';
      const updatedRow = await upsertPlan(userId, planDate, planData, status, clientOverride);
      return updatedRow ? updatedRow.plan_data : planData;
    }

    return planData;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to sync meal plan logged states: ${err.message}`, 500);
  }
}
