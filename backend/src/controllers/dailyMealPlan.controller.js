import { pool } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { getCachedPlan, clearCachedPlan } from '../services/llm.service.js';
import { generateDailyMealPlan, swapMealItem } from '../services/dailyMealPlan.service.js';
import { getProfile } from '../services/profile.service.js';
import { searchFoods, getLogHistory, batchLogItems, getFoodById, getFoodsByCategory, createFoodLog, deleteFoodLogByPlan } from '../repositories/food.repository.js';
import { findByUserAndDate, markMealsLogged, markItemLogged } from '../repositories/dailyMealPlan.repository.js';

function isValidDateString(str) {
  if (typeof str !== 'string') return false;
  const d = new Date(str + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

async function get(req, res, next) {
  try {
    const userId = req.user.userId;
    let planDate = req.query.date;
    if (planDate && !isValidDateString(planDate)) {
      return errorResponse(res, 'Invalid date format (use YYYY-MM-DD)', 400, 'VALIDATION_ERROR');
    }
    planDate = planDate || getTodayString();
    const cached = getCachedPlan(userId, planDate, 'meal');
    if (cached && cached.status !== 'fallback') {
      return successResponse(res, { plan: cached, fromCache: true });
    }
    const dbPlan = await findByUserAndDate(userId, planDate);
    if (!dbPlan) {
      return successResponse(res, { plan: null, fromCache: false });
    }
    return successResponse(res, { plan: dbPlan.plan_data, fromCache: false });
  } catch (err) {
    next(err);
  }
}

async function generate(req, res, next) {
  try {
    const userId = req.user.userId;
    let planDate = req.body.date;
    if (planDate && !isValidDateString(planDate)) {
      return errorResponse(res, 'Invalid date format (use YYYY-MM-DD)', 400, 'VALIDATION_ERROR');
    }
    planDate = planDate || getTodayString();
    const result = await generateDailyMealPlan({
      getProfile: (id) => getProfile(id),
      getAllFoods: (id) => searchFoods(id, '', 200),
      getLogHistory: (id, days) => getLogHistory(id, days),
      userId,
      planDate,
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
    if (planDate !== getTodayString()) {
      return errorResponse(res, 'Can only log meals for today', 400, 'VALIDATION_ERROR');
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
    if (planDate !== getTodayString()) {
      return errorResponse(res, 'Can only toggle meals for today', 400, 'VALIDATION_ERROR');
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

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updated = await markItemLogged(userId, planDate, mealType, foodId, logged, client);
      if (!updated) {
        await client.query('ROLLBACK');
        return errorResponse(res, 'No daily meal plan found for the given date', 404, 'NOT_FOUND');
      }

      // Sync food_logs table
      if (logged) {
        const plan = await findByUserAndDate(userId, planDate, client);
        if (plan) {
          const data = plan.plan_data;
          for (const meal of data.meals) {
            if (meal.meal_type !== mealType) continue;
            for (const item of meal.items) {
              if (item.food_id === foodId) {
                await createFoodLog(userId, {
                  foodId: item.food_id,
                  calories: item.calories,
                  portionGrams: item.portion_grams,
                  logDate: planDate,
                  mealType: meal.meal_type,
                }, client);
              }
            }
          }
        }
      } else {
        await deleteFoodLogByPlan(userId, foodId, planDate, mealType, client);
      }

      await client.query('COMMIT');
      clearCachedPlan(userId, planDate, 'meal');
      return successResponse(res, { plan: updated.plan_data });
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

async function swapItemHandler(req, res, next) {
  try {
    const userId = req.user.userId;
    const { date: swapDate, mealType, foodId } = req.body;

    if (swapDate && !isValidDateString(swapDate)) {
      return errorResponse(res, 'Invalid date format (use YYYY-MM-DD)', 400, 'VALIDATION_ERROR');
    }
    const planDate = swapDate || getTodayString();
    if (planDate !== getTodayString()) {
      return errorResponse(res, 'Can only swap meals for today', 400, 'VALIDATION_ERROR');
    }
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(mealType)) {
      return errorResponse(res, `Invalid mealType "${mealType}"`, 400, 'VALIDATION_ERROR');
    }
    if (typeof foodId !== 'number' || foodId < 1) {
      return errorResponse(res, 'Invalid foodId', 400, 'VALIDATION_ERROR');
    }

    const result = await swapMealItem({
      userId,
      planDate,
      mealType,
      foodId,
      getFoodById: (id) => getFoodById(id),
      getFoodsByCategory: (userId, category) => getFoodsByCategory(userId, category),
    });

    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

export default {
  get,
  generate,
  logMeals,
  toggleItemLogged,
  swapItem: swapItemHandler,
};
