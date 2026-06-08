import { levenshteinDistance } from '../../utils/string.js';

export function validateMealPlanStructure(plan, weekStart, calorieTarget) {
  const errors = [];
  if (!plan || !Array.isArray(plan.days)) {
    return { valid: false, errors: ['Plan must have a "days" array'] };
  }
  if (plan.days.length !== 7) {
    errors.push(`Expected 7 days but got ${plan.days.length}`);
  }
  const startDate = new Date(weekStart + 'T00:00:00Z');
  const dayMs = 24 * 60 * 60 * 1000;
  plan.days.forEach((day, i) => {
    const expectedDate = new Date(startDate.getTime() + i * dayMs);
    const expectedStr = expectedDate.toISOString().split('T')[0];
    if (day.date !== expectedStr) {
      errors.push(`Day ${i + 1}: expected date ${expectedStr} but got ${day.date}`);
    }
    if (!Array.isArray(day.meals)) {
      errors.push(`Day ${i + 1}: "meals" must be an array`);
      return;
    }
    if (day.meals.length !== 4) {
      errors.push(`Day ${i + 1}: expected 4 meals but got ${day.meals.length}`);
    }
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    day.meals.forEach((meal, j) => {
      if (!meal.meal_type || !validMealTypes.includes(meal.meal_type)) {
        errors.push(`Day ${i + 1}, meal ${j + 1}: invalid meal_type "${meal.meal_type}"`);
      }
      if (!Array.isArray(meal.items)) {
        errors.push(`Day ${i + 1}, meal ${j + 1}: "items" must be an array`);
        return;
      }
      if (meal.items.length < 1 || meal.items.length > 4) {
        errors.push(`Day ${i + 1}, meal ${j + 1}: expected 1-4 items but got ${meal.items.length}`);
      }
      meal.items.forEach((item, k) => {
        if (!item.food_id || typeof item.food_id !== 'number' || item.food_id < 1) {
          errors.push(`Day ${i + 1}, meal ${j + 1}, item ${k + 1}: invalid food_id`);
        }
        if (!item.food_name || typeof item.food_name !== 'string' || item.food_name.trim().length === 0) {
          errors.push(`Day ${i + 1}, meal ${j + 1}, item ${k + 1}: food_name is required`);
        }
        if (!item.portion_grams || item.portion_grams < 10 || item.portion_grams > 500) {
          errors.push(`Day ${i + 1}, meal ${j + 1}, item ${k + 1}: portion_grams must be 10-500`);
        }
      });
    });
    const dayTotal = day.meals.reduce((sum, meal) => {
      return sum + (meal.items || []).reduce((s, item) => s + (item.calories || 0), 0);
    }, 0);
    if (dayTotal < calorieTarget * 0.8 || dayTotal > calorieTarget * 1.2) {
      errors.push(`Day ${i + 1}: total calories ${dayTotal} outside 80-120% of target ${calorieTarget}`);
    }
  });
  return { valid: errors.length === 0, errors };
}

export function fuzzyMatchFoodName(name, dbFoods) {
  if (!name || typeof name !== 'string') {
    return { matched: false, food: null, matchType: 'none' };
  }
  const normalized = name.trim().toLowerCase();
  if (normalized.length === 0) {
    return { matched: false, food: null, matchType: 'none' };
  }
  const exact = dbFoods.find(f => f.name.toLowerCase() === normalized);
  if (exact) {
    return { matched: true, food: exact, matchType: 'exact' };
  }
  const contains = dbFoods.find(f =>
    f.name.toLowerCase().includes(normalized) || normalized.includes(f.name.toLowerCase())
  );
  if (contains) {
    console.warn(`[MealPlan] Fuzzy match: "${name}" → "${contains.name}" (case-insensitive)`);
    return { matched: true, food: contains, matchType: 'case-insensitive' };
  }
  let bestMatch = null;
  let bestDistance = 4;
  for (const food of dbFoods) {
    const dist = levenshteinDistance(normalized, food.name.toLowerCase());
    if (dist < bestDistance) {
      bestDistance = dist;
      bestMatch = food;
    }
  }
  if (bestMatch) {
    console.warn(`[MealPlan] Fuzzy match: "${name}" → "${bestMatch.name}" (Levenshtein: ${bestDistance})`);
    return { matched: true, food: bestMatch, matchType: 'levenshtein' };
  }
  return { matched: false, food: null, matchType: 'none' };
}

export function recalculateDayCalories(day) {
  if (!day || !Array.isArray(day.meals)) return;
  let dayTotal = 0;
  for (const meal of day.meals) {
    if (!Array.isArray(meal.items)) continue;
    let mealTotal = 0;
    for (const item of meal.items) {
      mealTotal += item.calories || 0;
    }
    meal.total_calories = mealTotal;
    dayTotal += mealTotal;
  }
  day.total_calories = dayTotal;
}

export function validateAndFixMealPlan(plan, dbFoods) {
  const errors = [];
  const warnings = [];
  if (!plan || !Array.isArray(plan.days)) {
    return { valid: false, plan, errors: ['Plan has no days array'], warnings };
  }
  plan = JSON.parse(JSON.stringify(plan));
  for (let di = 0; di < plan.days.length; di++) {
    const day = plan.days[di];
    if (!Array.isArray(day.meals)) continue;
    for (const meal of day.meals) {
      if (!Array.isArray(meal.items)) continue;
      const validItems = [];
      for (const item of meal.items) {
        const result = fuzzyMatchFoodName(item.food_name, dbFoods);
        if (!result.matched) {
          warnings.push(`Day ${di + 1}, ${meal.meal_type}: "${item.food_name}" not found in database — removed`);
          continue;
        }
        item.food_id = result.food.id;
        const originalName = item.food_name;
        item.food_name = result.food.name;
        if (result.matchType !== 'exact') {
          console.warn(`[MealPlan] Fixed food name: "${originalName}" → "${result.food.name}"`);
        }
        const serverCalories = Math.round((result.food.calories_per_100g * item.portion_grams) / 100);
        if (item.calories && Math.abs(item.calories - serverCalories) > 20) {
          console.warn(`[MealPlan] Overrode LLM calorie: ${item.food_name} ${item.calories} → ${serverCalories}`);
        }
        item.calories = serverCalories;
        validItems.push(item);
      }
      meal.items = validItems;
      recalculateDayCalories(day);
      if (meal.items.length === 0) {
        errors.push(`Day ${di + 1} ${meal.meal_type}: all items were removed`);
      }
    }
    if (day.meals.every(m => m.items.length === 0)) {
      errors.push(`Day ${di + 1}: no items remaining`);
    }
  }
  return { valid: errors.length === 0, plan, errors, warnings };
}
