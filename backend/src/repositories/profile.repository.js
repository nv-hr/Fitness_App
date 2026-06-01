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
 * @param {string|null} params.calorieRate
 * @param {number|null} params.targetWeightKg
 * @param {string|null} params.targetDate
 * @returns {Promise<Object>} Created profile row
 */
export async function create({ userId, weightKg, heightCm, age, gender, fitnessGoal, activityLevel, calorieRate, targetWeightKg, targetDate }) {
  try {
    const { rows } = await pool.query(
      'INSERT INTO profiles (user_id, weight_kg, height_cm, age, gender, fitness_goal, activity_level, calorie_rate, target_weight_kg, target_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [userId, weightKg, heightCm, age, gender, fitnessGoal, activityLevel, calorieRate, targetWeightKg, targetDate]
    );
    return rows[0] || null;
  } catch (err) {
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
    const { rows } = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to find profile: ${err.message}`, 500);
  }
}

/**
 * Update only the weight_kg field on a user's profile.
 * Used when weight is logged via the progress tracking feature.
 * @param {number} userId
 * @param {number} weightKg
 * @returns {Promise<{success: boolean}>}
 */
export async function updateWeightKg(userId, weightKg) {
  try {
    const { rowCount } = await pool.query(
      'UPDATE profiles SET weight_kg = $1, updated_at = NOW() WHERE user_id = $2',
      [weightKg, userId]
    );
    return { success: rowCount > 0 };
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to update profile weight: ${err.message}`, 500);
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
 * @param {string|null} params.calorieRate
 * @param {number|null} params.targetWeightKg
 * @param {string|null} params.targetDate
 * @returns {Promise<{success: boolean}>}
 */
export async function updateByUserId(userId, { weightKg, heightCm, age, gender, fitnessGoal, activityLevel, calorieRate, targetWeightKg, targetDate }) {
  try {
    const { rows } = await pool.query(
      'UPDATE profiles SET weight_kg = $1, height_cm = $2, age = $3, gender = $4, fitness_goal = $5, activity_level = $6, calorie_rate = $7, target_weight_kg = $8, target_date = $9, updated_at = NOW() WHERE user_id = $10 RETURNING *',
      [weightKg, heightCm, age, gender, fitnessGoal, activityLevel, calorieRate, targetWeightKg, targetDate, userId]
    );
    if (!rows[0]) {
      return { success: false, profile: null };
    }
    return { success: true, profile: rows[0] };
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to update profile: ${err.message}`, 500);
  }
}
