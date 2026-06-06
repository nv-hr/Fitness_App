import { buildPrompt, callLlmApi, getCachedPlan, setCachedPlan, clearCachedPlan, buildCorrectionPrompt as buildMealPlanCorrectionPrompt } from './llm.service.js';
import { findByUserAndWeek, upsertPlan } from '../repositories/mealPlan.repository.js';
import { AppError } from '../utils/errors.js';
import { levenshteinDistance } from '../utils/string.js';

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

export function buildMealPlanPrompt(profile, dbFoods, recentLogs, weekStart, calorieTarget, tdee) {
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
    console.warn(`[MealPlan] Truncated food list from ${dbFoods.length} to ${truncated.length} items due to token budget`);
  }
  const recentText = recentLogs && recentLogs.length > 0
    ? recentLogs.slice(0, 7).map(log =>
        `- ${log.log_date}: ${log.total_calories} kcal (${log.entry_count} items)`
      ).join('\n')
    : 'No recent food logs available.';
  return buildPrompt('meal-plan-prompt.md', {
    foodDatabase: foodText,
    calorieTarget: String(calorieTarget),
    weekStartDate: weekStart,
    weightKg: String(profile.weight_kg || profile.weightKg || ''),
    heightCm: String(profile.height_cm || profile.heightCm || ''),
    age: String(profile.age || ''),
    gender: profile.gender || '',
    fitnessGoal: profile.fitness_goal || profile.fitnessGoal || '',
    recentFoodLogs: recentText,
    tdee: String(tdee || ''),
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

export async function generateFallbackMealPlan(calorieTarget, weekStart, dbFoods) {
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
    if (group) {
      groups[group].push(food);
    } else {
      others.push(food);
    }
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
  const startDate = new Date(weekStart + 'T00:00:00Z');
  const dayMs = 24 * 60 * 60 * 1000;
  const buildMeals = () => {
    const breakfastTarget = Math.round(calorieTarget * 0.22);
    const lunchTarget = Math.round(calorieTarget * 0.33);
    const dinnerTarget = Math.round(calorieTarget * 0.33);
    const snackTarget = Math.round(calorieTarget * 0.12);
    const breakfastItems = selected.carbs.slice(0, 1).map(f => ({
      food_id: f.id, food_name: f.name, portion_grams: calcPortion(Math.round(breakfastTarget * 0.5), f.calories_per_100g), meal_type: 'breakfast',
    }));
    if (selected.dairy.length > 0) {
      breakfastItems.push({
        food_id: selected.dairy[0].id, food_name: selected.dairy[0].name,
        portion_grams: calcPortion(Math.round(breakfastTarget * 0.5), selected.dairy[0].calories_per_100g), meal_type: 'breakfast',
      });
    }
    const lunchItems = selected.protein.slice(0, 1).map(f => ({
      food_id: f.id, food_name: f.name, portion_grams: calcPortion(Math.round(lunchTarget * 0.5), f.calories_per_100g), meal_type: 'lunch',
    }));
    lunchItems.push(...selected.carbs.slice(1, 2).map(f => ({
      food_id: f.id, food_name: f.name, portion_grams: calcPortion(Math.round(lunchTarget * 0.3), f.calories_per_100g), meal_type: 'lunch',
    })));
    lunchItems.push(...selected.vegetables.slice(0, 1).map(f => ({
      food_id: f.id, food_name: f.name, portion_grams: calcPortion(Math.round(lunchTarget * 0.2), f.calories_per_100g), meal_type: 'lunch',
    })));
    const dinnerItems = selected.protein.slice(1, 2).map(f => ({
      food_id: f.id, food_name: f.name, portion_grams: calcPortion(Math.round(dinnerTarget * 0.6), f.calories_per_100g), meal_type: 'dinner',
    }));
    dinnerItems.push(...selected.vegetables.slice(1, 2).map(f => ({
      food_id: f.id, food_name: f.name, portion_grams: calcPortion(Math.round(dinnerTarget * 0.4), f.calories_per_100g), meal_type: 'dinner',
    })));
    const snackItems = selected.fruit.slice(0, 1).map(f => ({
      food_id: f.id, food_name: f.name, portion_grams: calcPortion(snackTarget, f.calories_per_100g), meal_type: 'snack',
    }));
    const allItems = [...breakfastItems, ...lunchItems, ...dinnerItems, ...snackItems];
    allItems.forEach(item => {
      const food = dbFoods.find(f => f.id === item.food_id);
      if (food) item.calories = Math.round((food.calories_per_100g * item.portion_grams) / 100);
    });
    const sumItems = (items) => items.reduce((s, i) => s + (i.calories || 0), 0);
    return [
      { meal_type: 'breakfast', items: breakfastItems, total_calories: sumItems(breakfastItems) },
      { meal_type: 'lunch', items: lunchItems, total_calories: sumItems(lunchItems) },
      { meal_type: 'dinner', items: dinnerItems, total_calories: sumItems(dinnerItems) },
      { meal_type: 'snack', items: snackItems, total_calories: sumItems(snackItems) },
    ];
  };
  const meals = buildMeals();
  const dayTotal = meals.reduce((s, m) => s + m.total_calories, 0);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate.getTime() + i * dayMs);
    const dateStr = date.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      meals: JSON.parse(JSON.stringify(meals)),
      total_calories: dayTotal,
      logged: false,
    });
  }
  return {
    days,
    calorie_target: calorieTarget,
    generated_at: new Date().toISOString(),
    llm_model: 'template-fallback',
  };
}

export async function generateMealPlan(deps) {
  const { userId, weekStart, getProfile, getAllFoods, getLogHistory } = deps;
  const cached = getCachedPlan(userId, weekStart, 'meal');
  if (cached) {
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
    console.error('[MealPlan] Failed to fetch user data:', err.message);
    try { dbFoods = await getAllFoods(userId); } catch { dbFoods = []; }
    const fallback = await generateFallbackMealPlan(2000, weekStart, dbFoods);
    return { plan: fallback, fromCache: false, status: 'fallback' };
  }
  if (!profile || !profile.profile) {
    const fallback = await generateFallbackMealPlan(2000, weekStart, dbFoods);
    return { plan: fallback, fromCache: false, status: 'fallback' };
  }
  const calorieTarget = profile.calorieTarget || 2000;
  const userProfile = profile.profile;
  const prompt = buildMealPlanPrompt(userProfile, dbFoods, recentLogs, weekStart, calorieTarget, profile.tdee);
  let plan;
  let attempt = 0;
  const maxAttempts = 2;
  let needsCorrection = false;
  let lastErrors = [];
  while (attempt < maxAttempts) {
    attempt++;
    try {
      if (!needsCorrection) {
        plan = await callLlmApi(prompt);
      } else {
        const correctionPrompt = prompt + '\n\n' + buildMealPlanCorrectionPrompt(lastErrors);
        plan = await callLlmApi(correctionPrompt);
      }
    } catch (err) {
      console.error(`[MealPlan] LLM API call attempt ${attempt} failed:`, err.message);
      if (attempt >= maxAttempts) {
        const fallback = await generateFallbackMealPlan(calorieTarget, weekStart, dbFoods);
        return { plan: fallback, fromCache: false, status: 'fallback' };
      }
      continue;
    }
    const structureCheck = validateMealPlanStructure(plan, weekStart, calorieTarget);
    if (!structureCheck.valid) {
      console.warn(`[MealPlan] Structure validation failed (attempt ${attempt}):`, structureCheck.errors.join('; '));
      if (attempt < maxAttempts) {
        needsCorrection = true;
        lastErrors = structureCheck.errors;
        continue;
      }
      break;
    }
    const nameCheck = validateAndFixMealPlan(plan, dbFoods);
    if (!nameCheck.valid) {
      console.warn(`[MealPlan] Name validation failed (attempt ${attempt}):`, nameCheck.errors.join('; '));
      if (attempt < maxAttempts) {
        needsCorrection = true;
        lastErrors = nameCheck.errors;
        continue;
      }
      break;
    }
    plan = nameCheck.plan;
    plan.calorie_target = calorieTarget;
    plan.generated_at = new Date().toISOString();
    plan.llm_model = process.env.LLM_MODEL || 'unknown';
    try {
      await upsertPlan(userId, weekStart, plan, 'active');
    } catch (err) {
      console.error('[MealPlan] Failed to persist generated plan:', err.message);
    }
    setCachedPlan(userId, weekStart, JSON.parse(JSON.stringify(plan)), 'meal');
    return { plan, fromCache: false, status: 'active' };
  }
  console.warn('[MealPlan] All generation attempts failed, returning fallback');
  const fallback = await generateFallbackMealPlan(calorieTarget, weekStart, dbFoods);
  fallback.calorie_target = calorieTarget;
  fallback.generated_at = new Date().toISOString();
  fallback.llm_model = 'template-fallback';
  try {
    await upsertPlan(userId, weekStart, fallback, 'fallback');
  } catch (err) {
    console.error('[MealPlan] Failed to persist fallback plan:', err.message);
  }
  return { plan: fallback, fromCache: false, status: 'fallback' };
}

export async function regenerateDay(deps, dayIndex) {
  if (typeof dayIndex !== 'number' || dayIndex < 0 || dayIndex > 6) {
    throw new AppError('ValidationError', 'dayIndex must be a number between 0 and 6', 400);
  }
  const { userId, weekStart } = deps;
  clearCachedPlan(userId, weekStart, 'meal');
  const result = await generateMealPlan(deps);
  const freshPlan = result.plan;
  if (!freshPlan || !freshPlan.days || !freshPlan.days[dayIndex]) {
    throw new AppError('GenerationError', 'Failed to generate plan for the requested day', 500);
  }
  const cached = getCachedPlan(userId, weekStart, 'meal');
  let existingPlan;
  if (cached) {
    existingPlan = cached;
  } else {
    const dbPlan = await findByUserAndWeek(userId, weekStart);
    existingPlan = dbPlan ? dbPlan.plan_data : null;
  }
  if (!existingPlan) {
    return { plan: freshPlan, day: freshPlan.days[dayIndex], dayIndex, fromCache: false, status: result.status };
  }
  const mergedPlan = JSON.parse(JSON.stringify(existingPlan));
  mergedPlan.days[dayIndex] = freshPlan.days[dayIndex];
  mergedPlan.status = 'active';
  mergedPlan.generated_at = new Date().toISOString();
  mergedPlan.calorie_target = existingPlan.calorie_target || freshPlan.calorie_target;
  try {
    await upsertPlan(userId, weekStart, mergedPlan, 'active');
  } catch (err) {
    console.error('[MealPlan] Failed to persist regenerated plan:', err.message);
  }
  setCachedPlan(userId, weekStart, JSON.parse(JSON.stringify(mergedPlan)), 'meal');
  return { plan: mergedPlan, day: mergedPlan.days[dayIndex], dayIndex, fromCache: false, status: 'active' };
}
