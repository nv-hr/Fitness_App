import { pool } from '../config/database.js';
import { AppError } from '../utils/errors.js';

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
export async function getAllActivities(goalTags) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM activities
       WHERE goal_tags ?| $1
       ORDER BY name ASC`,
      [goalTags]
    );
    return rows;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get all activities: ${err.message}`, 500);
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
