import { pool } from '../config/database.js';
import { AppError } from '../utils/errors.js';

/**
 * Get random activities filtered by goal tags (D-45: goal-filtered daily shuffle).
 * Uses JSON_OVERLAPS for array intersection and ORDER BY RAND() for shuffle.
 * @param {number} userId
 * @param {string[]} goalTags
 * @param {number} count
 * @returns {Promise<Array>}
 */
export async function getRandomActivities(userId, goalTags, count = 5) {
  try {
    const tagsJson = JSON.stringify(goalTags);
    const [rows] = await pool.query(
      `SELECT * FROM activities
       WHERE JSON_OVERLAPS(goal_tags, CAST(? AS JSON))
       ORDER BY RAND()
       LIMIT ?`,
      [tagsJson, count]
    );
    return rows;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get random activities: ${err.message}`, 500);
  }
}

/**
 * Get all activities filtered by goal tags, ordered by name.
 * @param {number} userId
 * @param {string[]} goalTags
 * @returns {Promise<Array>}
 */
export async function getAllActivities(userId, goalTags) {
  try {
    const tagsJson = JSON.stringify(goalTags);
    const [rows] = await pool.query(
      `SELECT * FROM activities
       WHERE JSON_OVERLAPS(goal_tags, CAST(? AS JSON))
       ORDER BY name ASC`,
      [tagsJson]
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
    const [rows] = await pool.query(
      'SELECT * FROM activities WHERE id = ? LIMIT 1',
      [activityId]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get activity: ${err.message}`, 500);
  }
}
