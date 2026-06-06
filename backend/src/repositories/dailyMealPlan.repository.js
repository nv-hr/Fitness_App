import { pool } from '../config/database.js';
import { AppError } from '../utils/errors.js';

export async function findByUserAndDate(userId, planDate, clientOverride, forUpdate = false) {
  const db = clientOverride || pool;
  try {
    const queryStr = `SELECT id, user_id, plan_date, plan_data, status, created_at, updated_at
       FROM daily_meal_plans
       WHERE user_id = $1 AND plan_date = $2` + (forUpdate ? ' FOR UPDATE' : '');
    const { rows } = await db.query(queryStr, [userId, planDate]);
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to find daily meal plan: ${err.message}`, 500);
  }
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

export async function upsertPlan(userId, planDate, planData, status = 'active', clientOverride) {
  const db = clientOverride || pool;
  try {
    const { rows } = await db.query(
      `INSERT INTO daily_meal_plans (user_id, plan_date, plan_data, status)
       VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (user_id, plan_date)
       DO UPDATE SET plan_data = $3::jsonb, status = $4, updated_at = NOW()
       RETURNING id, user_id, plan_date, plan_data, status, created_at, updated_at`,
      [userId, planDate, JSON.stringify(planData), status]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to upsert daily meal plan: ${err.message}`, 500);
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
