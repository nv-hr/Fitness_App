import { validateMealPlanStructure, validateAndFixMealPlan, fuzzyMatchFoodName } from '../../src/services/mealPlan/validator.js';

describe('mealPlan.validator', () => {
  const weekStart = '2026-06-08';
  const calorieTarget = 2000;

  describe('validateMealPlanStructure', () => {
    it('passes a valid structure', () => {
      const plan = {
        days: Array(7).fill(null).map((_, i) => ({
          date: new Date(new Date(weekStart).getTime() + i * 86400000).toISOString().split('T')[0],
          meals: [
            { meal_type: 'breakfast', items: [{ food_id: 1, food_name: 'Egg', portion_grams: 100, calories: 500 }] },
            { meal_type: 'lunch', items: [{ food_id: 2, food_name: 'Chicken', portion_grams: 200, calories: 500 }] },
            { meal_type: 'dinner', items: [{ food_id: 3, food_name: 'Rice', portion_grams: 200, calories: 500 }] },
            { meal_type: 'snack', items: [{ food_id: 4, food_name: 'Apple', portion_grams: 150, calories: 500 }] },
          ]
        }))
      };
      const result = validateMealPlanStructure(plan, weekStart, calorieTarget);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('fails if there are not 7 days', () => {
      const plan = { days: [] };
      const result = validateMealPlanStructure(plan, weekStart, calorieTarget);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected 7 days but got 0');
    });

    it('fails if calories are out of bounds', () => {
      const plan = {
        days: Array(7).fill(null).map((_, i) => ({
          date: new Date(new Date(weekStart).getTime() + i * 86400000).toISOString().split('T')[0],
          meals: [
            { meal_type: 'breakfast', items: [{ food_id: 1, food_name: 'Egg', portion_grams: 100, calories: 10 }] },
            { meal_type: 'lunch', items: [{ food_id: 2, food_name: 'Chicken', portion_grams: 200, calories: 10 }] },
            { meal_type: 'dinner', items: [{ food_id: 3, food_name: 'Rice', portion_grams: 200, calories: 10 }] },
            { meal_type: 'snack', items: [{ food_id: 4, food_name: 'Apple', portion_grams: 150, calories: 10 }] },
          ]
        }))
      };
      const result = validateMealPlanStructure(plan, weekStart, calorieTarget);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/outside 80-120% of target/);
    });
  });

  describe('fuzzyMatchFoodName', () => {
    const dbFoods = [
      { id: 1, name: 'Chicken Breast', calories_per_100g: 165 },
      { id: 2, name: 'White Rice', calories_per_100g: 130 }
    ];

    it('finds exact match case-insensitive', () => {
      const res = fuzzyMatchFoodName('white RICE', dbFoods);
      expect(res.matched).toBe(true);
      expect(res.food.id).toBe(2);
    });

    it('finds substring match', () => {
      const res = fuzzyMatchFoodName('chicken', dbFoods);
      expect(res.matched).toBe(true);
      expect(res.food.id).toBe(1);
    });
  });

  describe('validateAndFixMealPlan', () => {
    it('fixes names, sets IDs and calories', () => {
      const plan = {
        days: [{
          date: '2026-06-08',
          meals: [{
            meal_type: 'lunch',
            items: [{ food_name: 'chicken', portion_grams: 200, calories: 300 }]
          }]
        }]
      };
      const dbFoods = [{ id: 10, name: 'Chicken Breast', calories_per_100g: 150 }];
      
      const result = validateAndFixMealPlan(plan, dbFoods);
      expect(result.valid).toBe(true);
      
      const item = result.plan.days[0].meals[0].items[0];
      expect(item.food_id).toBe(10);
      expect(item.food_name).toBe('Chicken Breast');
      expect(item.calories).toBe(300); // 150 * 200 / 100
    });
  });
});
