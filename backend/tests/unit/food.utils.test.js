import {
  fuzzyMatchFoodName,
  recalculateDayCalories,
} from '../../src/utils/food.js';

const mockFoods = [
  { id: 1, name: 'Chicken breast, raw, skinless', calories_per_100g: 165, category: 'meat' },
  { id: 2, name: 'White rice, cooked', calories_per_100g: 130, category: 'grains' },
  { id: 3, name: 'Broccoli, raw', calories_per_100g: 34, category: 'vegetables' },
  { id: 4, name: 'Banana, raw', calories_per_100g: 52, category: 'fruits' },
  { id: 5, name: 'Whole milk', calories_per_100g: 42, category: 'dairy' },
];

describe('fuzzyMatchFoodName', () => {
  test('returns exact match', () => {
    const result = fuzzyMatchFoodName('Chicken breast, raw, skinless', mockFoods);
    expect(result.matched).toBe(true);
    expect(result.matchType).toBe('exact');
  });

  test('returns exact match after lowercasing', () => {
    const result = fuzzyMatchFoodName('CHICKEN BREAST, RAW, SKINLESS', mockFoods);
    expect(result.matched).toBe(true);
    expect(result.matchType).toBe('exact');
  });

  test('returns substring match', () => {
    const result = fuzzyMatchFoodName('Chicken breast', mockFoods);
    expect(result.matched).toBe(true);
    expect(result.matchType).toBe('case-insensitive');
  });

  test('returns Levenshtein match within 3 edits', () => {
    const result = fuzzyMatchFoodName('Chiken breast, raw, skinles', mockFoods);
    expect(result.matched).toBe(true);
    expect(result.matchType).toBe('levenshtein');
  });

  test('returns no match for completely different food', () => {
    const result = fuzzyMatchFoodName('Tofu', mockFoods);
    expect(result.matched).toBe(false);
    expect(result.matchType).toBe('none');
  });

  test('handles null/empty input gracefully', () => {
    expect(fuzzyMatchFoodName('', mockFoods).matched).toBe(false);
    expect(fuzzyMatchFoodName(null, mockFoods).matched).toBe(false);
  });
});

describe('recalculateDayCalories', () => {
  test('recalculates meal and day totals', () => {
    const day = {
      date: '2026-01-05',
      meals: [
        { meal_type: 'breakfast', items: [{ food_id: 2, food_name: 'White rice, cooked', portion_grams: 150, calories: 195, meal_type: 'breakfast' }], total_calories: 500 },
        { meal_type: 'lunch', items: [{ food_id: 1, food_name: 'Chicken breast, raw, skinless', portion_grams: 150, calories: 248, meal_type: 'lunch' }], total_calories: 248 },
        { meal_type: 'dinner', items: [{ food_id: 3, food_name: 'Broccoli, raw', portion_grams: 100, calories: 34, meal_type: 'dinner' }], total_calories: 34 },
        { meal_type: 'snack', items: [{ food_id: 4, food_name: 'Banana, raw', portion_grams: 120, calories: 62, meal_type: 'snack' }], total_calories: 62 },
      ],
      total_calories: 5000,
    };
    recalculateDayCalories(day);
    expect(day.meals[0].total_calories).toBe(195);
    expect(day.total_calories).toBe(195 + 248 + 34 + 62);
  });
});
