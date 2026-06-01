import { pool } from '../config/database.js';
import { AppError } from '../utils/errors.js';

export async function upsertWeightLog(userId, { weightKg, loggedDate, source, notes }) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO weight_logs (user_id, weight_kg, logged_date, source, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, logged_date) DO UPDATE
         SET weight_kg = EXCLUDED.weight_kg,
             source = EXCLUDED.source,
             notes = COALESCE(EXCLUDED.notes, weight_logs.notes),
             created_at = NOW()
       RETURNING *`,
      [userId, weightKg, loggedDate, source, notes || null]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to upsert weight log: ${err.message}`, 500);
  }
}

export async function getWeightHistory(userId, limit = 50) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM weight_logs WHERE user_id = $1 ORDER BY logged_date DESC LIMIT $2',
      [userId, limit]
    );
    return rows;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get weight history: ${err.message}`, 500);
  }
}

export async function deleteWeightLog(logId, userId) {
  try {
    const { rows } = await pool.query(
      'DELETE FROM weight_logs WHERE id = $1 AND user_id = $2 RETURNING id',
      [logId, userId]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to delete weight log: ${err.message}`, 500);
  }
}
