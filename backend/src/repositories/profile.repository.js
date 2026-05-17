import { pool } from '../config/database.js';
import { AppError } from '../utils/errors.js';

/**
 * Create a new profile for a user.
 * @param {Object} params
 * @param {number} params.userId
 * @param {number} params.weightKg
 * @param {number} params.heightCm
 * @param {number} params.age
 * @param {string} params.gender
 * @param {string} params.fitnessGoal
 * @param {string|null} params.activityLevel
 * @returns {Promise<Object>} Created profile row
 */
export async function create({ userId, weightKg, heightCm, age, gender, fitnessGoal, activityLevel }) {
  try {
    await pool.query(
      'INSERT INTO profiles (user_id, weight_kg, height_cm, age, gender, fitness_goal, activity_level) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, weightKg, heightCm, age, gender, fitnessGoal, activityLevel]
    );
    const [rows] = await pool.query(
      'SELECT * FROM profiles WHERE id = LAST_INSERT_ID()'
    );
    return rows[0] || null;
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('DuplicateError', 'Profile already exists', 409);
    }
    throw new AppError('DatabaseError', `Failed to create profile: ${err.message}`, 500);
  }
}

/**
 * Find a profile by user ID.
 * @param {number} userId
 * @returns {Promise<Object|null>} Profile row or null
 */
export async function findByUserId(userId) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM profiles WHERE user_id = ? LIMIT 1',
      [userId]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to find profile: ${err.message}`, 500);
  }
}

/**
 * Update a profile by user ID.
 * @param {number} userId
 * @param {Object} params
 * @param {number} params.weightKg
 * @param {number} params.heightCm
 * @param {number} params.age
 * @param {string} params.gender
 * @param {string} params.fitnessGoal
 * @param {string|null} params.activityLevel
 * @returns {Promise<{success: boolean}>}
 */
export async function updateByUserId(userId, { weightKg, heightCm, age, gender, fitnessGoal, activityLevel }) {
  try {
    await pool.query(
      'UPDATE profiles SET weight_kg = ?, height_cm = ?, age = ?, gender = ?, fitness_goal = ?, activity_level = ?, updated_at = NOW() WHERE user_id = ?',
      [weightKg, heightCm, age, gender, fitnessGoal, activityLevel, userId]
    );
    return { success: true };
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to update profile: ${err.message}`, 500);
  }
}
