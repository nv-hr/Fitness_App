import { ValidationError } from '../utils/errors.js';

const VALID_CATEGORIES = ['proteins', 'carbs', 'vegetables', 'fruits', 'dairy', 'fats', 'drinks', 'other'];

/**
 * Get count of seeded (non-custom) foods in the database.
 * Used to verify seeding was successful.
 * @param {Function} countFoods - Repository function to count foods
 * @returns {Promise<number>}
 */
export async function getSeededFoodCount(countFoods) {
  return countFoods({ is_custom: false });
}

/**
 * Get food counts grouped by category for seeded foods.
 * @param {Function} findByCategory - Repository function to count by category
 * @returns {Promise<Object>} Object with category keys and count values
 */
export async function getFoodsByCategory(findByCategory) {
  const result = {};
  for (const category of VALID_CATEGORIES) {
    result[category] = await findByCategory(category, { is_custom: false });
  }
  return result;
}

/**
 * Validate custom food input data.
 * @param {Object} data
 * @param {string} data.name - Food name (1-100 characters)
 * @param {number} data.calories_per_100g - Calories per 100g (0-5000)
 * @param {string} data.category - Must be one of 7 valid categories
 * @throws {ValidationError} with Indonesian message on failure
 */
export function validateFoodData(data) {
  const { name, calories_per_100g, category } = data;

  if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
    throw new ValidationError('Nama makanan wajib diisi (1-100 karakter)');
  }

  if (calories_per_100g == null || typeof calories_per_100g !== 'number' || calories_per_100g < 0 || calories_per_100g > 5000) {
    throw new ValidationError('Kalori per 100g harus antara 0-5000 kkal');
  }

  if (!category || !VALID_CATEGORIES.includes(category)) {
    throw new ValidationError('Kategori makanan tidak valid');
  }
}

/**
 * Calculate calories for a given portion based on calories per 100g.
 * Formula: (caloriesPer100g * portionGrams) / 100
 * @param {number} caloriesPer100g
 * @param {number} portionGrams
 * @returns {number} Rounded calorie value
 */
export function calculateCalories(caloriesPer100g, portionGrams) {
  return Math.round((caloriesPer100g * portionGrams) / 100);
}
