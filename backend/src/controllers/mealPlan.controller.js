import { pool } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { getCachedPlan } from '../services/llm.service.js';
import { generateMealPlan, regenerateDay } from '../services/mealPlan.service.js';
import { getProfile } from '../services/profile.service.js';
import { searchFoods, batchLogItems, getLogHistory } from '../repositories/food.repository.js';
import { findByUserAndWeek, markItemsLogged } from '../repositories/mealPlan.repository.js';

function isValidDateString(str) {
  if (typeof str !== 'string') return false;
  const d = new Date(str + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

function getMonday(date) {
  const d = new Date(date);
  const localDay = d.getDay();
  const diff = d.getDate() - localDay + (localDay === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

async function get(req, res, next) {
  try {
    const userId = req.user.userId;
    let weekStart = req.query.weekStart;
    if (weekStart && !isValidDateString(weekStart)) {
      return errorResponse(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR');
    }
    weekStart = getMonday(weekStart ? new Date(weekStart) : new Date());
    const cached = getCachedPlan(userId, weekStart);
    if (cached && cached.status !== 'fallback') {
      return successResponse(res, { plan: cached, fromCache: true });
    }
    const dbPlan = await findByUserAndWeek(userId, weekStart);
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
    let weekStart = req.body.weekStart;
    if (weekStart && !isValidDateString(weekStart)) {
      return errorResponse(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR');
    }
    weekStart = getMonday(weekStart ? new Date(weekStart) : new Date());
    const result = await generateMealPlan({
      getProfile: (id) => getProfile(id),
      getAllFoods: (id) => searchFoods(id, '', 200),
      getLogHistory: (id, days) => getLogHistory(id, days),
      userId,
      weekStart,
    });
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

async function regenerateDayHandler(req, res, next) {
  try {
    const userId = req.user.userId;
    const { weekStart, dayIndex } = req.body;
    if (typeof dayIndex !== 'number' || dayIndex < 0 || dayIndex > 6) {
      return errorResponse(res, 'dayIndex must be a number between 0 and 6', 400, 'VALIDATION_ERROR');
    }
    let targetWeekStart = weekStart;
    if (targetWeekStart && !isValidDateString(targetWeekStart)) {
      return errorResponse(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR');
    }
    targetWeekStart = getMonday(targetWeekStart ? new Date(targetWeekStart) : new Date());
    const result = await regenerateDay({
      getProfile: (id) => getProfile(id),
      getAllFoods: (id) => searchFoods(id, '', 200),
      getLogHistory: (id, days) => getLogHistory(id, days),
      userId,
      weekStart: targetWeekStart,
    }, dayIndex);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

async function logDay(req, res, next) {
  try {
    const userId = req.user.userId;
    const { weekStart, dayIndex, mealType } = req.body;
    if (weekStart && !isValidDateString(weekStart)) {
      return errorResponse(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR');
    }
    const targetWeekStart = getMonday(weekStart ? new Date(weekStart) : new Date());
    if (typeof dayIndex !== 'number' || dayIndex < 0 || dayIndex > 6) {
      return errorResponse(res, 'dayIndex must be a number between 0 and 6', 400, 'VALIDATION_ERROR');
    }
    const plan = await findByUserAndWeek(userId, targetWeekStart);
    if (!plan) {
      return errorResponse(res, 'No meal plan found for the given week', 404, 'NOT_FOUND');
    }
    const data = plan.plan_data;
    if (!data.days || !data.days[dayIndex]) {
      return errorResponse(res, 'Day not found in meal plan', 404, 'NOT_FOUND');
    }
    const day = data.days[dayIndex];
    const items = [];
    for (const meal of day.meals) {
      if (mealType && meal.meal_type !== mealType) continue;
      for (const item of meal.items) {
        if (item.logged) continue;
        items.push({
          foodId: item.food_id,
          portionGrams: item.portion_grams,
          calories: item.calories,
          logDate: day.date,
          mealType: meal.meal_type,
        });
      }
    }
    if (items.length === 0) {
      return successResponse(res, { logged: 0, message: 'All items already logged.' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await batchLogItems(userId, items, client);
      await markItemsLogged(userId, targetWeekStart, dayIndex, mealType || null, client);
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

export default {
  get,
  generate,
  regenerateDay: regenerateDayHandler,
  logDay,
};
