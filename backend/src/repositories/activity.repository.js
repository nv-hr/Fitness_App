import { pool } from '../config/database.js';
import { AppError } from '../utils/errors.js';
import { getHistoryCutoffStr } from '../utils/date.utils.js';

/**
 * Get random activities filtered by goal tags (D-45: goal-filtered daily shuffle).
 * Uses JSONB ?| operator for array overlap and ORDER BY RANDOM() for shuffle.
 * @param {string[]} goalTags
 * @param {number} count
 * @returns {Promise<Array>}
 */
export async function getRandomActivities(goalTags, count = 5) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM activities
       WHERE goal_tags ?| $1
       ORDER BY RANDOM()
       LIMIT $2`,
      [goalTags, count]
    );
    return rows;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get random activities: ${err.message}`, 500);
  }
}

/**
 * Get all activities filtered by goal tags, ordered by name.
 * Uses JSONB ?| operator for array overlap.
 * @param {string[]} goalTags
 * @returns {Promise<Array>}
 */
export async function getAllActivities(goalTags = []) {
  try {
    const hasTags = goalTags && goalTags.length > 0;
    const query = hasTags
      ? `SELECT * FROM activities WHERE goal_tags ?| $1 ORDER BY name ASC`
      : `SELECT * FROM activities ORDER BY name ASC`;
    const params = hasTags ? [goalTags] : [];
    const { rows } = await pool.query(query, params);
    return rows;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get all activities: ${err.message}`, 500);
  }
}

/**
 * Get activities filtered by a specific goal tag and calorie ceiling.
 * Uses JSONB @> operator to ensure the tag is present.
 * @param {string} fitnessGoal
 * @param {number} maxCalories
 * @returns {Promise<Array>}
 */
async function getActivitiesByGoalAndCeiling(fitnessGoal, maxCalories) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM activities 
       WHERE goal_tags @> $1 AND estimated_calories <= $2 
       ORDER BY name ASC`,
      [JSON.stringify([fitnessGoal]), maxCalories]
    );
    return rows;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get activities by goal and ceiling: ${err.message}`, 500);
  }
}

/**
 * Get activities filtered by calorie ceiling only (fallback query).
 * @param {number} maxCalories
 * @returns {Promise<Array>}
 */
async function getAllActivitiesWithCeiling(maxCalories) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM activities 
       WHERE estimated_calories <= $1 
       ORDER BY name ASC`,
      [maxCalories]
    );
    return rows;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get activities with ceiling: ${err.message}`, 500);
  }
}

/**
 * Get a single activity by ID.
 * @param {number} activityId
 * @returns {Promise<Object|null>}
 */
export async function getActivityById(activityId) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM activities WHERE id = $1 LIMIT 1',
      [activityId]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get activity: ${err.message}`, 500);
  }
}

/**
 * Create a new activity log entry.
 * @param {number} userId
 * @param {Object} logData
 * @param {number} logData.activityId
 * @param {number} logData.durationMin
 * @param {string} logData.intensity
 * @param {number} logData.caloriesBurned
 * @param {string} logData.loggedDate
 * @returns {Promise<Object>}
 */
export async function createActivityLog(userId, { activityId, durationMin, intensity, caloriesBurned, loggedDate }) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO activity_logs (user_id, activity_id, duration_min, intensity, calories_burned, logged_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, activityId, durationMin, intensity, caloriesBurned, loggedDate]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to create activity log: ${err.message}`, 500);
  }
}

/**
 * Batch insert activity log entries within a transaction (caller manages commit/rollback).
 * @param {number} userId
 * @param {Array<{activityId: number, durationMin: number, intensity: string, caloriesBurned: number, loggedDate: string}>} items
 * @param {import('pg').PoolClient} clientOverride
 * @returns {Promise<Array>}
 */
export async function batchLogActivities(userId, items, clientOverride) {
  if (!items || items.length === 0) return [];
  const client = clientOverride || await pool.connect();
  const ownsClient = !clientOverride;
  try {
    if (ownsClient) await client.query('BEGIN');
    const inserted = [];
    for (const item of items) {
      const { rows } = await client.query(
        `INSERT INTO activity_logs (user_id, activity_id, duration_min, intensity, calories_burned, logged_date)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, item.activityId, item.durationMin, item.intensity, item.caloriesBurned, item.loggedDate]
      );
      inserted.push(rows[0]);
    }
    if (ownsClient) await client.query('COMMIT');
    return inserted;
  } catch (err) {
    if (ownsClient) await client.query('ROLLBACK');
    throw new AppError('DatabaseError', `Failed to batch log activities: ${err.message}`, 500);
  } finally {
    if (ownsClient) client.release();
  }
}

/**
 * Get all activity log entries for a specific date, with activity name.
 * @param {number} userId
 * @param {string} date
 * @returns {Promise<Array>}
 */
export async function getActivityLogsByDate(userId, date) {
  try {
    const { rows } = await pool.query(
      `SELECT al.*, a.name as activity_name, a.estimated_calories, a.duration_min as activity_duration_min
       FROM activity_logs al
       JOIN activities a ON al.activity_id = a.id
       WHERE al.user_id = $1 AND al.logged_date = $2
       ORDER BY al.created_at DESC`,
      [userId, date]
    );
    return rows;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get activity logs: ${err.message}`, 500);
  }
}

/**
 * Get activity history grouped by date with totals.
 * @param {number} userId
 * @param {number} days
 * @returns {Promise<Array>}
 */
export async function getActivityHistory(userId, days = 7) {
  try {
    const cutoffStr = getHistoryCutoffStr(days, true);
    const { rows } = await pool.query(
      `SELECT al.logged_date, SUM(al.duration_min) as total_minutes, SUM(al.calories_burned) as total_burned, COUNT(*) as entry_count
       FROM activity_logs al
       WHERE al.user_id = $1 AND al.logged_date >= $2::date
       GROUP BY al.logged_date
       ORDER BY al.logged_date DESC`,
      [userId, cutoffStr]
    );
    return rows.map(r => ({
      ...r,
      logged_date: r.logged_date instanceof Date ? r.logged_date.toISOString().split('T')[0] : r.logged_date,
    }));
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get activity history: ${err.message}`, 500);
  }
}

/**
 * Get activity logs in a date range with activity name (for detailed history).
 * @param {number} userId
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Promise<Array>}
 */
async function getActivityLogsInRange(userId, startDate, endDate) {
  try {
    const { rows } = await pool.query(
      `SELECT al.*, a.name as activity_name
       FROM activity_logs al
       JOIN activities a ON al.activity_id = a.id
       WHERE al.user_id = $1 AND al.logged_date >= $2 AND al.logged_date <= $3
       ORDER BY al.logged_date DESC, al.created_at DESC`,
      [userId, startDate, endDate]
    );
    return rows;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get activity logs in range: ${err.message}`, 500);
  }
}

/**
 * Get an activity log entry by ID scoped by user.
 * @param {number} logId
 * @param {number} userId
 * @returns {Promise<Object|null>}
 */
export async function getActivityLogById(logId, userId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM activity_logs WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [logId, userId]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get activity log: ${err.message}`, 500);
  }
}

/**
 * Delete an activity log entry scoped by user.
 * @param {number} logId
 * @param {number} userId
 * @returns {Promise<number|null>} Deleted id or null if not found/not owned
 */
export async function deleteActivityLog(logId, userId) {
  try {
    const { rows } = await pool.query(
      `DELETE FROM activity_logs WHERE id = $1 AND user_id = $2 RETURNING id`,
      [logId, userId]
    );
    return rows[0] ? rows[0].id : null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to delete activity log: ${err.message}`, 500);
  }
}

/**
 * Upsert an activity log entry from a weekly plan toggle.
 * Finds existing entry by (user_id, activity_id, logged_date), or inserts a new one.
 * @param {number} userId
 * @param {Object} data
 * @param {number} data.activityId
 * @param {number} data.durationMin
 * @param {string} data.intensity
 * @param {number} data.caloriesBurned
 * @param {string} data.loggedDate
 * @returns {Promise<Object>}
 */
export async function upsertActivityLogFromPlan(userId, { activityId, durationMin, intensity, caloriesBurned, loggedDate }) {
  try {
    const existing = await pool.query(
      `SELECT id FROM activity_logs WHERE user_id = $1 AND activity_id = $2 AND logged_date = $3 LIMIT 1`,
      [userId, activityId, loggedDate]
    );
    if (existing.rows.length > 0) {
      const { rows } = await pool.query(
        `UPDATE activity_logs SET duration_min = $1, intensity = $2, calories_burned = $3, created_at = NOW()
         WHERE id = $4 RETURNING *`,
        [durationMin, intensity, caloriesBurned, existing.rows[0].id]
      );
      return rows[0];
    }
    const { rows } = await pool.query(
      `INSERT INTO activity_logs (user_id, activity_id, duration_min, intensity, calories_burned, logged_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, activityId, durationMin, intensity, caloriesBurned, loggedDate]
    );
    return rows[0];
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to upsert activity log from plan: ${err.message}`, 500);
  }
}

/**
 * Delete an activity log entry by (user_id, activity_id, logged_date).
 * @param {number} userId
 * @param {number} activityId
 * @param {string} loggedDate
 * @returns {Promise<boolean>} Whether a row was deleted
 */
export async function deleteActivityLogByPlan(userId, activityId, loggedDate, durationMin) {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM activity_logs
       WHERE id IN (
         SELECT id FROM activity_logs
         WHERE user_id = $1 AND activity_id = $2 AND logged_date = $3 AND duration_min = $4
         LIMIT 1
       )`,
      [userId, activityId, loggedDate, durationMin]
    );
    return (rowCount || 0) > 0;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to delete activity log from plan: ${err.message}`, 500);
  }
}

/**
 * Get user's most-frequently logged activities for fallback plan generation.
 * @param {number} userId
 * @param {number} limit - Max activities to return (default 5)
 * @returns {Promise<Array<{ id: number, name: string, estimated_calories: number, duration_min: number, log_count: number }>>}
 */
export async function getTopActivities(userId, limit = 5) {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.name, a.estimated_calories, a.duration_min, COUNT(al.id) as log_count
       FROM activity_logs al
       JOIN activities a ON al.activity_id = a.id
       WHERE al.user_id = $1
       GROUP BY a.id, a.name, a.estimated_calories, a.duration_min
       ORDER BY log_count DESC
       LIMIT $2`,
      [userId, limit]
    );
    return rows;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get top activities: ${err.message}`, 500);
  }
}

/**
 * Get daily activity totals (calories burned and minutes).
 * @param {number} userId
 * @param {string} date
 * @returns {Promise<{total_burned: number, total_minutes: number}>}
 */
export async function getDailyActivityTotal(userId, date) {
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(calories_burned), 0) as total_burned, COALESCE(SUM(duration_min), 0) as total_minutes
       FROM activity_logs
       WHERE user_id = $1 AND logged_date = $2`,
      [userId, date]
    );
    return { total_burned: Number(rows[0].total_burned), total_minutes: Number(rows[0].total_minutes) };
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get daily activity total: ${err.message}`, 500);
  }
}

/**
 * Get activity history with full entry details (single query JOIN for grouped display).
 * @param {number} userId
 * @param {number} days
 * @returns {Promise<Array>}
 */
export async function getActivityHistoryWithEntries(userId, days = 7) {
  try {
    const cutoffStr = getHistoryCutoffStr(days, true);
    const { rows } = await pool.query(
      `SELECT al.*, a.name as activity_name
       FROM activity_logs al
       JOIN activities a ON al.activity_id = a.id
       WHERE al.user_id = $1 AND al.logged_date >= $2
       ORDER BY al.logged_date DESC, al.created_at DESC`,
      [userId, cutoffStr]
    );
    return rows.map(r => ({
      ...r,
      logged_date: r.logged_date instanceof Date
        ? r.logged_date.toISOString().split('T')[0]
        : r.logged_date,
    }));
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get activity history with entries: ${err.message}`, 500);
  }
}
