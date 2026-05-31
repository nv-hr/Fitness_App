import { buildPrompt, callLlmApi, getCachedPlan, setCachedPlan } from './llm.service.js';
import { findByUserAndDate, upsertPlan } from '../repositories/dailyMealPlan.repository.js';
import { fuzzyMatchFoodName, recalculateDayCalories } from './mealPlan.service.js';
import { AppError } from '../utils/errors.js';

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export function validateDailyMealPlanStructure(plan) {
  const errors = [];
  if (!plan || !Array.isArray(plan.meals)) {
    return { valid: false, errors: ['Plan must have a "meals" array'] };
  }
  if (plan.meals.length !== 4) {
    errors.push(`Expected 4 meals but got ${plan.meals.length}`);
  }
  plan.meals.forEach((meal, i) => {
    if (!meal.meal_type || !VALID_MEAL_TYPES.includes(meal.meal_type)) {
      errors.push(`Meal ${i + 1}: invalid meal_type "${meal.meal_type}"`);
    }
    if (!Array.isArray(meal.items)) {
      errors.push(`Meal ${i + 1}: "items" must be an array`);
      return;
    }
    if (meal.items.length < 1 || meal.items.length > 4) {
      errors.push(`Meal ${i + 1}: expected 1-4 items but got ${meal.items.length}`);
    }
    meal.items.forEach((item, k) => {
      if (!item.food_id || typeof item.food_id !== 'number' || item.food_id < 1) {
        errors.push(`Meal ${i + 1}, item ${k + 1}: invalid food_id`);
      }
      if (!item.food_name || typeof item.food_name !== 'string' || item.food_name.trim().length === 0) {
        errors.push(`Meal ${i + 1}, item ${k + 1}: food_name is required`);
      }
      if (!item.portion_grams || item.portion_grams < 10 || item.portion_grams > 500) {
        errors.push(`Meal ${i + 1}, item ${k + 1}: portion_grams must be 10-500`);
      }
    });
  });
  return { valid: errors.length === 0, errors };
}

export function validateAndFixDailyMealPlan(plan, dbFoods) {
  const errors = [];
  const warnings = [];
  if (!plan || !Array.isArray(plan.meals)) {
    return { valid: false, plan, errors: ['Plan has no meals array'], warnings };
  }
  plan = JSON.parse(JSON.stringify(plan));
  for (const meal of plan.meals) {
    if (!Array.isArray(meal.items)) continue;
    const validItems = [];
    for (const item of meal.items) {
      const result = fuzzyMatchFoodName(item.food_name, dbFoods);
      if (!result.matched) {
        warnings.push(`${meal.meal_type}: "${item.food_name}" not found in database — removed`);
        continue;
      }
      item.food_id = result.food.id;
      const originalName = item.food_name;
      item.food_name = result.food.name;
      const serverCalories = Math.round((result.food.calories_per_100g * item.portion_grams) / 100);
      item.calories = serverCalories;
      validItems.push(item);
    }
    meal.items = validItems;
    if (meal.items.length === 0) {
      errors.push(`${meal.meal_type}: all items were removed`);
    }
  }
  const dayTotal = plan.meals.reduce((sum, meal) => {
    return sum + (meal.items || []).reduce((s, item) => s + (item.calories || 0), 0);
  }, 0);
  plan.total_calories = dayTotal;
  return { valid: errors.length === 0, plan, errors, warnings };
}

function buildDailyMealPlanPrompt(profile, dbFoods, recentLogs, planDate, calorieTarget) {
  let foodText = dbFoods.map(f =>
    `- ID ${f.id}: ${f.name} (${f.calories_per_100g} cal/100g, ${f.category})`
  ).join('\n');
  if (foodText.length > 12000) {
    const categorized = {};
    for (const f of dbFoods) {
      (categorized[f.category] = categorized[f.category] || []).push(f);
    }
    const truncated = [];
    const categories = Object.keys(categorized).sort();
    const maxPerCategory = Math.ceil(150 / categories.length);
    for (const cat of categories) {
      truncated.push(...categorized[cat].slice(0, maxPerCategory));
    }
    foodText = truncated.map(f =>
      `- ID ${f.id}: ${f.name} (${f.calories_per_100g} cal/100g, ${f.category})`
    ).join('\n');
  }
  const recentText = recentLogs && recentLogs.length > 0
    ? recentLogs.slice(0, 7).map(log =>
        `- ${log.log_date}: ${log.total_calories} kcal (${log.entry_count} items)`
      ).join('\n')
    : 'No recent food logs available.';
  return buildPrompt('daily-meal-plan-prompt.md', {
    foodDatabase: foodText,
    calorieTarget: String(calorieTarget),
    weightKg: String(profile.weight_kg || profile.weightKg || ''),
    heightCm: String(profile.height_cm || profile.heightCm || ''),
    age: String(profile.age || ''),
    gender: profile.gender || '',
    fitnessGoal: profile.fitness_goal || profile.fitnessGoal || '',
    recentFoodLogs: recentText,
  });
}

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function calcPortion(targetCal, calPer100g) {
  const raw = Math.round((targetCal / calPer100g) * 100);
  return Math.max(10, Math.min(500, raw));
}

function generateFallbackDailyMealPlan(calorieTarget, dbFoods) {
  const categoryMap = {
    meat: 'protein', poultry: 'protein', fish: 'protein', seafood: 'protein', eggs: 'protein',
    grains: 'carbs', rice: 'carbs', pasta: 'carbs', bread: 'carbs', cereal: 'carbs', legumes: 'carbs',
    vegetables: 'vegetables', vegetable: 'vegetables',
    fruits: 'fruits', fruit: 'fruits',
    dairy: 'dairy', milk: 'dairy', cheese: 'dairy', yogurt: 'dairy',
  };
  const groups = { protein: [], carbs: [], vegetables: [], fruits: [], dairy: [] };
  const others = [];
  for (const food of dbFoods) {
    const group = categoryMap[food.category?.toLowerCase()];
    if (group) groups[group].push(food);
    else others.push(food);
  }
  for (const key of Object.keys(groups)) {
    if (groups[key].length === 0 && others.length > 0) {
      groups[key] = [others.shift()];
    }
  }
  const selected = {
    protein: pickRandom(groups.protein.length > 0 ? groups.protein : others, 2),
    carbs: pickRandom(groups.carbs.length > 0 ? groups.carbs : others, 2),
    vegetables: pickRandom(groups.vegetables.length > 0 ? groups.vegetables : others, 2),
    fruit: pickRandom(groups.fruits.length > 0 ? groups.fruits : others, 1),
    dairy: pickRandom(groups.dairy.length > 0 ? groups.dairy : others, 1),
  };
  const buildItems = (foods, targetCal) => foods.map(f => ({
    food_id: f.id,
    food_name: f.name,
    portion_grams: calcPortion(Math.round(targetCal / foods.length), f.calories_per_100g),
  }));
  const breakfastTarget = Math.round(calorieTarget * 0.22);
  const lunchTarget = Math.round(calorieTarget * 0.33);
  const dinnerTarget = Math.round(calorieTarget * 0.33);
  const snackTarget = Math.round(calorieTarget * 0.12);
  const breakfastItems = [...buildItems(selected.carbs.slice(0, 1), breakfastTarget * 0.5), ...buildItems(selected.dairy.slice(0, 1), breakfastTarget * 0.5)];
  const lunchItems = [...buildItems(selected.protein.slice(0, 1), lunchTarget * 0.5), ...buildItems(selected.carbs.slice(1, 2), lunchTarget * 0.3), ...buildItems(selected.vegetables.slice(0, 1), lunchTarget * 0.2)];
  const dinnerItems = [...buildItems(selected.protein.slice(1, 2), dinnerTarget * 0.6), ...buildItems(selected.vegetables.slice(1, 2), dinnerTarget * 0.4)];
  const snackItems = buildItems(selected.fruit.slice(0, 1), snackTarget);
  const allMeals = [
    { meal_type: 'breakfast', items: breakfastItems },
    { meal_type: 'lunch', items: lunchItems },
    { meal_type: 'dinner', items: dinnerItems },
    { meal_type: 'snack', items: snackItems },
  ];
  const getAllFoods = () => {
    const all = [];
    for (const m of allMeals) {
      for (const i of m.items) {
        const food = dbFoods.find(f => f.id === i.food_id);
        if (food) i.calories = Math.round((food.calories_per_100g * i.portion_grams) / 100);
      }
    }
    return all;
  };
  getAllFoods();
  const totalCalories = allMeals.reduce((s, m) => s + m.items.reduce((sum, i) => sum + (i.calories || 0), 0), 0);
  return {
    meals: allMeals,
    total_calories: totalCalories,
    calorie_target: calorieTarget,
    generated_at: new Date().toISOString(),
    llm_model: 'template-fallback',
  };
}

export async function generateDailyMealPlan(deps) {
  const { userId, planDate, getProfile, getAllFoods, getLogHistory } = deps;
  const cached = getCachedPlan(userId, planDate, 'meal');
  if (cached && cached.status !== 'fallback') {
    return { plan: cached, fromCache: true, status: 'active' };
  }
  let profile, dbFoods, recentLogs;
  try {
    [profile, dbFoods, recentLogs] = await Promise.all([
      getProfile(userId),
      getAllFoods(userId),
      getLogHistory(userId, 7),
    ]);
  } catch (err) {
    console.error('[DailyMealPlan] Failed to fetch user data:', err.message);
    try { dbFoods = await getAllFoods(userId); } catch { dbFoods = []; }
    const fallback = generateFallbackDailyMealPlan(2000, dbFoods);
    return { plan: fallback, fromCache: false, status: 'fallback' };
  }
  if (!profile || !profile.profile) {
    const fallback = generateFallbackDailyMealPlan(2000, dbFoods || []);
    return { plan: fallback, fromCache: false, status: 'fallback' };
  }
  const calorieTarget = profile.calorieTarget || 2000;
  const userProfile = profile.profile;
  const prompt = buildDailyMealPlanPrompt(userProfile, dbFoods, recentLogs, planDate, calorieTarget);
  let plan;
  let attempt = 0;
  const maxAttempts = 2;
  while (attempt < maxAttempts) {
    attempt++;
    try {
      plan = await callLlmApi(prompt);
    } catch (err) {
      console.error(`[DailyMealPlan] LLM API call attempt ${attempt} failed:`, err.message);
      if (attempt >= maxAttempts) {
        const fallback = generateFallbackDailyMealPlan(calorieTarget, dbFoods || []);
        return { plan: fallback, fromCache: false, status: 'fallback' };
      }
      continue;
    }
    const structureCheck = validateDailyMealPlanStructure(plan);
    if (!structureCheck.valid) {
      console.warn(`[DailyMealPlan] Structure validation failed (attempt ${attempt}):`, structureCheck.errors.join('; '));
      if (attempt < maxAttempts) continue;
      break;
    }
    const nameCheck = validateAndFixDailyMealPlan(plan, dbFoods);
    if (!nameCheck.valid) {
      console.warn(`[DailyMealPlan] Name validation failed (attempt ${attempt}):`, nameCheck.errors.join('; '));
      if (attempt < maxAttempts) continue;
      break;
    }
    plan = nameCheck.plan;
    plan.date = planDate;
    plan.calorie_target = calorieTarget;
    plan.generated_at = new Date().toISOString();
    plan.llm_model = process.env.LLM_MODEL || 'unknown';
    for (const meal of plan.meals) {
      for (const item of (meal.items || [])) {
        item.logged = false;
      }
    }
    try {
      await upsertPlan(userId, planDate, plan, 'active');
    } catch (err) {
      console.error('[DailyMealPlan] Failed to persist generated plan:', err.message);
    }
    setCachedPlan(userId, planDate, JSON.parse(JSON.stringify(plan)), 'meal');
    return { plan, fromCache: false, status: 'active' };
  }
  console.warn('[DailyMealPlan] All generation attempts failed, returning fallback');
  const fallback = generateFallbackDailyMealPlan(calorieTarget, dbFoods || []);
  fallback.date = planDate;
  fallback.calorie_target = calorieTarget;
  fallback.generated_at = new Date().toISOString();
  fallback.llm_model = 'template-fallback';
  for (const meal of fallback.meals) {
    for (const item of (meal.items || [])) {
      item.logged = false;
    }
  }
  try {
    await upsertPlan(userId, planDate, fallback, 'fallback');
  } catch (err) {
    console.error('[DailyMealPlan] Failed to persist fallback plan:', err.message);
  }
  return { plan: fallback, fromCache: false, status: 'fallback' };
}
