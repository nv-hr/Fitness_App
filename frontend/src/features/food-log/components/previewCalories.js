/**
 * Calculates the preview calories for a food portion.
 * Returns null if inputs are invalid, otherwise returns rounded calories.
 * Uses identical formula to server-side calculateCalories(): Math.round((caloriesPer100g * portionGrams) / 100)
 *
 * @param {number|null} caloriesPer100g - Calories per 100g of the food
 * @param {string|number} portion - Portion weight in grams
 * @returns {number|null} Rounded calorie value, or null if invalid
 */
export function calculatePreviewCalories(caloriesPer100g, portion) {
  const grams = parseInt(portion, 10);
  if (!caloriesPer100g || isNaN(grams) || grams < 1 || grams > 5000) {
    return null;
  }
  return Math.round((caloriesPer100g * grams) / 100);
}
