import { pool } from '../config/database.js';
import { AppError } from '../utils/errors.js';

export async function findByUserAndWeek(userId, weekStart) {
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, week_start, plan_data, status, created_at, updated_at
       FROM meal_plans
       WHERE user_id = $1 AND week_start = $2
       LIMIT 1`,
      [userId, weekStart]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to find meal plan: ${err.message}`, 500);
  }
}

export async function upsertPlan(userId, weekStart, planData, status = 'active') {
  try {
    const { rows } = await pool.query(
      `INSERT INTO meal_plans (user_id, week_start, plan_data, status)
       VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (user_id, week_start)
       DO UPDATE SET plan_data = $3::jsonb, status = $4, updated_at = NOW()
       RETURNING id, user_id, week_start, plan_data, status, created_at, updated_at`,
      [userId, weekStart, JSON.stringify(planData), status]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to upsert meal plan: ${err.message}`, 500);
  }
}

export async function markItemsLogged(userId, weekStart, dayIndex, mealType) {
  try {
    const plan = await findByUserAndWeek(userId, weekStart);
    if (!plan) return null;
    const data = plan.plan_data;
    if (!data.days || !data.days[dayIndex]) return null;
    const day = data.days[dayIndex];
    for (const meal of day.meals) {
      if (mealType && meal.meal_type !== mealType) continue;
      for (const item of meal.items) {
        item.logged = true;
      }
    }
    return upsertPlan(userId, weekStart, data, plan.status);
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to mark items logged: ${err.message}`, 500);
  }
}
