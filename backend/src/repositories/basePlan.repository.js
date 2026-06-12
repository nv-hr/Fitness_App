import { pool } from '../config/database.js';
import { AppError } from '../utils/errors.js';

export async function findPlanByUserAndDate(tableName, userId, planDate, clientOverride, forUpdate = false) {
  const db = clientOverride || pool;
  try {
    const queryStr = `SELECT id, user_id, plan_date, plan_data, status, created_at, updated_at
       FROM ${tableName}
       WHERE user_id = $1 AND plan_date = $2` + (forUpdate ? ' FOR UPDATE' : ' LIMIT 1');
    const { rows } = await db.query(queryStr, [userId, planDate]);
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to find plan in ${tableName}: ${err.message}`, 500);
  }
}

export async function upsertPlanBase(tableName, userId, planDate, planData, status = 'active', clientOverride) {
  const db = clientOverride || pool;
  try {
    const { rows } = await db.query(
      `INSERT INTO ${tableName} (user_id, plan_date, plan_data, status)
       VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (user_id, plan_date)
       DO UPDATE SET plan_data = $3::jsonb, status = $4, updated_at = NOW()
       RETURNING id, user_id, plan_date, plan_data, status, created_at, updated_at`,
      [userId, planDate, JSON.stringify(planData), status]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to upsert plan in ${tableName}: ${err.message}`, 500);
  }
}
