import { pool } from '../config/database.js';
import { AppError } from '../utils/errors.js';

/**
 * Search foods by name (seeded + user's custom foods).
 * Uses parameterized LIKE query to prevent SQL injection (T-04-04).
 * @param {number} userId
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function searchFoods(userId, query, limit = 20) {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, calories_per_100g, category
       FROM foods
       WHERE (is_custom = FALSE OR user_id = ?)
         AND name LIKE ?
       ORDER BY CASE WHEN is_custom = FALSE THEN 0 ELSE 1 END, name
       LIMIT ?`,
      [userId, `%${query}%`, limit]
    );
    return rows;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to search foods: ${err.message}`, 500);
  }
}

/**
 * Create a custom food for the authenticated user (D-38: user-private).
 * @param {number} userId
 * @param {Object} foodData
 * @param {string} foodData.name
 * @param {number} foodData.calories_per_100g
 * @param {string} foodData.category
 * @returns {Promise<Object>}
 */
export async function createCustomFood(userId, { name, calories_per_100g, category }) {
  try {
    await pool.query(
      'INSERT INTO foods (user_id, name, calories_per_100g, category, is_custom) VALUES (?, ?, ?, ?, TRUE)',
      [userId, name, calories_per_100g, category]
    );
    const [rows] = await pool.query(
      'SELECT * FROM foods WHERE id = LAST_INSERT_ID()'
    );
    return rows[0] || null;
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('DuplicateError', 'Makanan sudah ada', 409);
    }
    throw new AppError('DatabaseError', `Failed to create custom food: ${err.message}`, 500);
  }
}

/**
 * Create a food log entry for a user.
 * Supports both seeded foods (foodId set) and custom one-off entries (customFoodName set).
 * @param {number} userId
 * @param {Object} logData
 * @param {number|null} logData.foodId
 * @param {string|null} logData.customFoodName
 * @param {number} logData.calories
 * @param {number} logData.portionGrams
 * @param {string} logData.logDate
 * @param {string} logData.mealType
 * @returns {Promise<Object>}
 */
export async function createFoodLog(userId, { foodId, customFoodName, calories, portionGrams, logDate, mealType }) {
  try {
    await pool.query(
      `INSERT INTO food_logs (user_id, food_id, custom_food_name, calories, portion_grams, log_date, meal_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, foodId || null, customFoodName || null, calories, portionGrams, logDate, mealType]
    );
    const [rows] = await pool.query(
      'SELECT * FROM food_logs WHERE id = LAST_INSERT_ID()'
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to create food log: ${err.message}`, 500);
  }
}

/**
 * Get all food log entries for a specific date.
 * @param {number} userId
 * @param {string} logDate
 * @returns {Promise<Array>}
 */
export async function getDailyLogs(userId, logDate) {
  try {
    const [rows] = await pool.query(
      `SELECT fl.*, f.name as food_name, f.calories_per_100g
       FROM food_logs fl
       LEFT JOIN foods f ON fl.food_id = f.id
       WHERE fl.user_id = ? AND fl.log_date = ?
       ORDER BY fl.meal_type, fl.created_at`,
      [userId, logDate]
    );
    return rows;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get daily logs: ${err.message}`, 500);
  }
}

/**
 * Get total calories consumed for a specific date.
 * @param {number} userId
 * @param {string} logDate
 * @returns {Promise<number>}
 */
export async function getDailyTotal(userId, logDate) {
  try {
    const [rows] = await pool.query(
      'SELECT COALESCE(SUM(calories), 0) as total FROM food_logs WHERE user_id = ? AND log_date = ?',
      [userId, logDate]
    );
    return rows[0].total || 0;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get daily total: ${err.message}`, 500);
  }
}

/**
 * Get daily calorie summary for the past N days.
 * @param {number} userId
 * @param {number} days
 * @returns {Promise<Array>}
 */
export async function getLogHistory(userId, days = 7) {
  try {
    const [rows] = await pool.query(
      `SELECT log_date, SUM(calories) as total_calories, COUNT(*) as entry_count
       FROM food_logs
       WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY log_date
       ORDER BY log_date DESC`,
      [userId, days]
    );
    return rows;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get log history: ${err.message}`, 500);
  }
}

/**
 * Get recently logged foods for quick-add (LOG-05).
 * Returns distinct food names ordered by most recent log.
 * @param {number} userId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getRecentFoods(userId, limit = 10) {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT COALESCE(f.name, fl.custom_food_name) as name,
              fl.food_id, fl.calories, fl.portion_grams
       FROM food_logs fl
       LEFT JOIN foods f ON fl.food_id = f.id
       WHERE fl.user_id = ?
       ORDER BY fl.log_date DESC, fl.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get recent foods: ${err.message}`, 500);
  }
}

/**
 * Count foods by filter criteria (used by food.service.js for seed verification).
 * @param {Object} filters
 * @param {boolean} filters.is_custom
 * @returns {Promise<number>}
 */
export async function countFoods({ is_custom }) {
  try {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM foods WHERE is_custom = ?',
      [is_custom ? 1 : 0]
    );
    return rows[0].count || 0;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to count foods: ${err.message}`, 500);
  }
}

/**
 * Count foods by category with optional is_custom filter.
 * @param {string} category
 * @param {Object} filters
 * @param {boolean} filters.is_custom
 * @returns {Promise<number>}
 */
export async function findByCategory(category, { is_custom } = {}) {
  try {
    let query = 'SELECT COUNT(*) as count FROM foods WHERE category = ?';
    const params = [category];
    if (is_custom !== undefined) {
      query += ' AND is_custom = ?';
      params.push(is_custom ? 1 : 0);
    }
    const [rows] = await pool.query(query, params);
    return rows[0].count || 0;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to find foods by category: ${err.message}`, 500);
  }
}

/**
 * Get a single food by ID (used by logFood to look up calories_per_100g).
 * @param {number} foodId
 * @returns {Promise<Object|null>}
 */
export async function getFoodById(foodId) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM foods WHERE id = ? LIMIT 1',
      [foodId]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to get food: ${err.message}`, 500);
  }
}
