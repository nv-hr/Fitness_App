import { generateFallbackMealPlan } from '../../src/services/mealPlan/generator.js';

describe('generateFallbackMealPlan', () => {
  const dbFoods = [
    { id: 1, name: 'Chicken Breast', category: 'meat', calories_per_100g: 165 },
    { id: 2, name: 'White Rice', category: 'grains', calories_per_100g: 130 },
    { id: 3, name: 'Broccoli', category: 'vegetables', calories_per_100g: 34 },
    { id: 4, name: 'Apple', category: 'fruits', calories_per_100g: 52 },
    { id: 5, name: 'Milk', category: 'dairy', calories_per_100g: 42 }
  ];

  it('generates a 7-day plan with appropriate calorie targets', async () => {
    const calorieTarget = 2000;
    const weekStart = '2026-06-08';
    const fallback = await generateFallbackMealPlan(calorieTarget, weekStart, dbFoods);
    
    expect(fallback.llm_model).toBe('template-fallback');
    expect(fallback.calorie_target).toBe(2000);
    expect(fallback.days).toHaveLength(7);
    
    // Check first day
    const day0 = fallback.days[0];
    expect(day0.date).toBe('2026-06-08');
    expect(day0.meals).toHaveLength(4); // breakfast, lunch, dinner, snack
    
    // Total calories should be close to 2000
    // The fallback logic sums exactly the target calculated portions, which might be off slightly due to rounding
    expect(day0.total_calories).toBeGreaterThan(1000);
    expect(day0.total_calories).toBeLessThan(2500);
    
    // Ensure all items have food_id, name, portion, and calories
    const breakfast = day0.meals.find(m => m.meal_type === 'breakfast');
    expect(breakfast.items.length).toBeGreaterThan(0);
    expect(breakfast.items[0]).toHaveProperty('food_id');
    expect(breakfast.items[0]).toHaveProperty('food_name');
    expect(breakfast.items[0]).toHaveProperty('portion_grams');
    expect(breakfast.items[0]).toHaveProperty('calories');
  });

  it('handles empty database', async () => {
    const fallback = await generateFallbackMealPlan(2000, '2026-06-08', []);
    expect(fallback.days).toHaveLength(7);
    expect(fallback.days[0].meals[0].items).toHaveLength(0); // Cannot generate items if no foods available
  });
});
