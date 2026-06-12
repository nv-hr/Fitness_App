import { pool } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { getCachedPlan, setCachedPlan, clearCachedPlan } from '../services/llm.service.js';
import { generateDailyMealPlan, regenerateCategory, toggleMealPlanItem } from '../services/dailyMealPlan.service.js';
import { getProfile } from '../services/profile.service.js';
import { searchFoods, getLogHistory, batchLogItems, getFoodById, createFoodLog, deleteFoodLogByPlan } from '../repositories/food.repository.js';
import { findByUserAndDate, markMealsLogged, markItemLogged } from '../repositories/dailyMealPlan.repository.js';
import { syncMealPlanLoggedStates } from '../repositories/mealPlanSync.repository.js';

function isValidDateString(str) {
  if (typeof str !== 'string') return false;
  const d = new Date(str + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

import { isDateWithinTimezoneRange } from '../utils/date.utils.js';
import { setupSSE } from '../utils/sse.utils.js';

async function get(req, res, next) {
  try {
    const userId = req.user.userId;
    let planDate = req.query.date;
    if (planDate && !isValidDateString(planDate)) {
      return errorResponse(res, 'Invalid date format (use YYYY-MM-DD)', 400, 'VALIDATION_ERROR');
    }
    planDate = planDate || getTodayString();
    
    let planData = null;
    const cached = getCachedPlan(userId, planDate, 'meal');
    if (cached && cached.status !== 'fallback') {
      planData = cached;
    } else {
      const dbPlan = await findByUserAndDate(userId, planDate);
      if (dbPlan) {
        planData = dbPlan.plan_data;
      }
    }

    if (!planData) {
      return successResponse(res, { plan: null, fromCache: false });
    }

    const syncedPlanData = await syncMealPlanLoggedStates(userId, planDate, planData);
    setCachedPlan(userId, planDate, syncedPlanData, 'meal');
    return successResponse(res, { plan: syncedPlanData, fromCache: false });
  } catch (err) {
    next(err);
  }
}

async function generate(req, res, next) {
  try {
    const userId = req.user.userId;
    let planDate = req.body.date;
    const forceFallback = req.body.fallback === true;
    if (planDate && !isValidDateString(planDate)) {
      return errorResponse(res, 'Invalid date format (use YYYY-MM-DD)', 400, 'VALIDATION_ERROR');
    }
    planDate = planDate || getTodayString();
    
    // Bypass existing check if forceFallback is requested
    if (!forceFallback) {
      const existing = await findByUserAndDate(userId, planDate);
      if (existing && existing.plan_data && existing.status !== 'fallback') {
        setCachedPlan(userId, planDate, structuredClone(existing.plan_data), 'meal');
        return successResponse(res, { plan: existing.plan_data, fromCache: false, status: 'active' });
      }
    }
    
    const result = await generateDailyMealPlan({
      getProfile: (id) => getProfile(id),
      getAllFoods: (id) => searchFoods(id, '', 200),
      getLogHistory: (id, days) => getLogHistory(id, days),
      userId,
      planDate,
      forceFallback,
    });
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

async function logMeals(req, res, next) {
  try {
    const userId = req.user.userId;
    const { date, mealTypes } = req.body;
    if (date && !isValidDateString(date)) {
      return errorResponse(res, 'Invalid date format (use YYYY-MM-DD)', 400, 'VALIDATION_ERROR');
    }
    const planDate = date || getTodayString();
    if (!isDateWithinTimezoneRange(planDate)) {
      return errorResponse(res, 'Can only log meals for today (considering timezone differences)', 400, 'VALIDATION_ERROR');
    }
    if (!Array.isArray(mealTypes) || mealTypes.length === 0) {
      return errorResponse(res, 'mealTypes must be a non-empty array', 400, 'VALIDATION_ERROR');
    }
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    for (const mt of mealTypes) {
      if (!validMealTypes.includes(mt)) {
        return errorResponse(res, `Invalid mealType "${mt}"`, 400, 'VALIDATION_ERROR');
      }
    }
    const plan = await findByUserAndDate(userId, planDate);
    if (!plan) {
      return errorResponse(res, 'No daily meal plan found for the given date', 404, 'NOT_FOUND');
    }
    const data = plan.plan_data;
    if (!data.meals || !Array.isArray(data.meals)) {
      return errorResponse(res, 'No meals found in plan', 404, 'NOT_FOUND');
    }
    const items = [];
    for (const meal of data.meals) {
      if (!mealTypes.includes(meal.meal_type)) continue;
      if (!Array.isArray(meal.items)) continue;
      for (const item of meal.items) {
        if (item.logged) continue;
        items.push({
          foodId: item.food_id,
          portionGrams: item.portion_grams,
          calories: item.calories,
          logDate: planDate,
          mealType: meal.meal_type,
        });
      }
    }
    if (items.length === 0) {
      return successResponse(res, { logged: 0, message: 'All selected meals already logged.' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await batchLogItems(userId, items, client);
      await markMealsLogged(userId, planDate, mealTypes, client);
      await client.query('COMMIT');
      clearCachedPlan(userId, planDate, 'meal');
      return successResponse(res, { logged: inserted.length, items: inserted });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

async function toggleItemLogged(req, res, next) {
  try {
    const userId = req.user.userId;
    const { date: toggleDate, mealType, foodId, logged } = req.body;

    if (toggleDate && !isValidDateString(toggleDate)) {
      return errorResponse(res, 'Invalid date format (use YYYY-MM-DD)', 400, 'VALIDATION_ERROR');
    }
    const planDate = toggleDate || getTodayString();
    if (!isDateWithinTimezoneRange(planDate)) {
      return errorResponse(res, 'Can only toggle meals for today (considering timezone differences)', 400, 'VALIDATION_ERROR');
    }
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(mealType)) {
      return errorResponse(res, `Invalid mealType "${mealType}"`, 400, 'VALIDATION_ERROR');
    }
    if (typeof foodId !== 'number' || foodId < 1) {
      return errorResponse(res, 'Invalid foodId', 400, 'VALIDATION_ERROR');
    }
    if (typeof logged !== 'boolean') {
      return errorResponse(res, 'logged must be a boolean', 400, 'VALIDATION_ERROR');
    }

    const updated = await toggleMealPlanItem(userId, planDate, mealType, foodId, logged);
    if (!updated) {
      return errorResponse(res, 'No daily meal plan found for the given date', 404, 'NOT_FOUND');
    }
    clearCachedPlan(userId, planDate, 'meal');
    return successResponse(res, { plan: updated.plan_data });
  } catch (err) {
    next(err);
  }
}

async function regenerateCategoryHandler(req, res, next) {
  try {
    const userId = req.user.userId;
    const { date: planDate, mealType } = req.body;

    if (planDate && !isValidDateString(planDate)) {
      return errorResponse(res, 'Invalid date format (use YYYY-MM-DD)', 400, 'VALIDATION_ERROR');
    }
    const targetDate = planDate || getTodayString();
    
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(mealType)) {
      return errorResponse(res, `Invalid mealType "${mealType}"`, 400, 'VALIDATION_ERROR');
    }

    const result = await regenerateCategory({
      userId,
      planDate: targetDate,
      mealType,
      getProfile: (id) => getProfile(id),
      getAllFoods: (id) => searchFoods(id, '', 200),
      getLogHistory: (id, days) => getLogHistory(id, days),
    });

    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

async function generateStream(req, res, next) {
  const userId = req.user.userId;
  let planDate = req.body.date;
  if (planDate && !isValidDateString(planDate)) {
    return errorResponse(res, 'Invalid date format (use YYYY-MM-DD)', 400, 'VALIDATION_ERROR');
  }
  planDate = planDate || getTodayString();

  const onChunk = setupSSE(res);

  try {
    const existing = await findByUserAndDate(userId, planDate);
    if (existing && existing.plan_data && existing.status !== 'fallback') {
      setCachedPlan(userId, planDate, structuredClone(existing.plan_data), 'meal');
      res.write(`data: ${JSON.stringify({ type: 'done', plan: existing.plan_data })}\n\n`);
      res.end();
      return;
    }

    const result = await generateDailyMealPlan({
      getProfile: (id) => getProfile(id),
      getAllFoods: (id) => searchFoods(id, '', 200),
      getLogHistory: (id, days) => getLogHistory(id, days),
      userId,
      planDate,
      onChunk,
    });

    res.write(`data: ${JSON.stringify({ type: 'done', plan: result.plan })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  }
}

async function regenerateCategoryStream(req, res, next) {
  const userId = req.user.userId;
  const { date: planDate, mealType } = req.body;

  if (planDate && !isValidDateString(planDate)) {
    return errorResponse(res, 'Invalid date format (use YYYY-MM-DD)', 400, 'VALIDATION_ERROR');
  }
  const targetDate = planDate || getTodayString();
  
  const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  if (!validMealTypes.includes(mealType)) {
    return errorResponse(res, `Invalid mealType "${mealType}"`, 400, 'VALIDATION_ERROR');
  }

  const onChunk = setupSSE(res);

  try {
    const result = await regenerateCategory({
      userId,
      planDate: targetDate,
      mealType,
      getProfile: (id) => getProfile(id),
      getAllFoods: (id) => searchFoods(id, '', 200),
      getLogHistory: (id, days) => getLogHistory(id, days),
      onChunk,
    });

    res.write(`data: ${JSON.stringify({ type: 'done', plan: result.plan })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  }
}

export default {
  get,
  generate,
  logMeals,
  toggleItemLogged,
  regenerateCategory: regenerateCategoryHandler,
  generateStream,
  regenerateCategoryStream,
};
