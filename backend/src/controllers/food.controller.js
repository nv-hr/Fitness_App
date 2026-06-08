import * as foodRepo from '../repositories/food.repository.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { ValidationError } from '../utils/errors.js';
import { calculateCalories, validateFoodData, validateCustomFoodData } from '../services/food.service.js';
import { findByUserId as findProfileByUserId } from '../repositories/profile.repository.js';
import { calculateTdee, getCalorieTarget } from '../services/profile.service.js';
import { markItemLogged, syncItemLoggedState } from '../repositories/dailyMealPlan.repository.js';
import { clearCachedPlan } from '../services/llm.service.js';

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

function isDateWithinTimezoneRange(dateStr) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  return dateStr === todayStr || dateStr === yesterdayStr || dateStr === tomorrowStr;
}

/**
 * GET /api/food/search?q= — Search foods by name (FOOD-01, FOOD-02).
 */
export async function searchFoods(req, res, next) {
  try {
    const q = req.query.q;
    if (!q || q.length < 2) {
      return errorResponse(res, 'Search query must be at least 2 characters', 400, 'VALIDATION_ERROR');
    }
    const foods = await foodRepo.searchFoods(req.user.userId, q);
    return successResponse(res, foods);
  } catch (err) {
    if (err instanceof ValidationError) {
      return errorResponse(res, err.message, 400, 'VALIDATION_ERROR');
    }
    next(err);
  }
}

/**
 * POST /api/food — Create custom food for authenticated user (FOOD-03).
 */
export async function createCustomFood(req, res, next) {
  try {
    const { name, calories_per_100g, category } = req.body;
    const validated = validateCustomFoodData({ name, calories_per_100g, category });
    const food = await foodRepo.createCustomFood(req.user.userId, validated);
    return successResponse(res, food, 201);
  } catch (err) {
    if (err instanceof ValidationError) {
      return errorResponse(res, err.message, 400, 'VALIDATION_ERROR');
    }
    next(err);
  }
}

/**
 * POST /api/food/log — Log a food entry (LOG-01).
 */
export async function logFood(req, res, next) {
  try {
    const { foodId, customFoodName, portionGrams, logDate, mealType, calories: clientCalories } = req.body;

    // Validate portion
    if (!portionGrams || portionGrams < 1 || portionGrams > 5000) {
      return errorResponse(res, 'Portion must be between 1-5000 grams', 400, 'VALIDATION_ERROR');
    }

    // Validate meal type
    if (!mealType || !VALID_MEAL_TYPES.includes(mealType)) {
      return errorResponse(res, 'Invalid meal type', 400, 'VALIDATION_ERROR');
    }

    // Default logDate to today
    const logDateValue = logDate || new Date().toISOString().split('T')[0];

    // Allow logging within timezone boundaries (yesterday, today, tomorrow relative to UTC)
    if (!isDateWithinTimezoneRange(logDateValue)) {
      return errorResponse(res, 'Can only log food for today (considering timezone differences)', 400, 'VALIDATION_ERROR');
    }

    let calories;
    if (foodId) {
      // Seeded food: calculate server-side from calories_per_100g (T-04-06)
      const food = await foodRepo.getFoodById(foodId);
      if (!food) {
        return errorResponse(res, 'Food not found', 404, 'NOT_FOUND');
      }
      calories = calculateCalories(food.calories_per_100g, portionGrams);
    } else if (customFoodName) {
      // Custom one-off: use client-supplied calories (CR-03 fix: allow zero-calorie foods)
      if (clientCalories == null || clientCalories < 0) {
        return errorResponse(res, 'Calories are required', 400, 'VALIDATION_ERROR');
      }
      calories = clientCalories;
    } else {
      return errorResponse(res, 'foodId or customFoodName is required', 400, 'VALIDATION_ERROR');
    }

    const log = await foodRepo.createFoodLog(req.user.userId, {
      foodId,
      customFoodName,
      calories,
      portionGrams,
      logDate: logDateValue,
      mealType,
    });

    try {
      if (foodId) {
        await syncItemLoggedState(req.user.userId, logDateValue, mealType, foodId);
        clearCachedPlan(req.user.userId, logDateValue, 'meal');
      }
    } catch (err) {
      console.error('Failed to sync food log to meal plan:', err.message);
    }

    return successResponse(res, log, 201);
  } catch (err) {
    if (err instanceof ValidationError) {
      return errorResponse(res, err.message, 400, 'VALIDATION_ERROR');
    }
    next(err);
  }
}

/**
 * GET /api/food/summary?date= — Daily calorie summary with balance (LOG-02, LOG-03, LOG-06).
 */
export async function getDailySummary(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    // Get total consumed (pg returns DECIMAL as string — ensure number)
    const rawTotal = await foodRepo.getDailyTotal(req.user.userId, date);
    const totalConsumed = Number(rawTotal);

    // Get user profile for calorie target calculation
    const profile = await findProfileByUserId(req.user.userId);
    let calorieTarget = null;
    if (profile) {
      const tdee = calculateTdee(profile.weight_kg, profile.height_cm, profile.age, profile.gender, profile.activity_level);
      if (tdee) {
        calorieTarget = getCalorieTarget(tdee, profile.fitness_goal, profile.calorie_rate);
      }
    }

    const remaining = calorieTarget !== null ? calorieTarget - totalConsumed : null;
    const isExtremeDeficit = totalConsumed < 1200;

    return successResponse(res, {
      date,
      totalConsumed,
      calorieTarget,
      remaining,
      isExtremeDeficit,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/food/logs?date= — Individual log entries for a date.
 */
export async function getDailyLogs(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const logs = await foodRepo.getDailyLogs(req.user.userId, date);
    return successResponse(res, logs);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/food/history?days= — Calorie history for past days (LOG-04).
 */
export async function getLogHistory(req, res, next) {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const history = await foodRepo.getLogHistory(req.user.userId, days);
    return successResponse(res, history);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/food/recent — Recently logged foods for quick-add (LOG-05).
 */
export async function getRecentFoods(req, res, next) {
  try {
    const recentFoods = await foodRepo.getRecentFoods(req.user.userId);
    return successResponse(res, recentFoods);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/food/log/:id — Delete a food log entry scoped to the authenticated user.
 * Why user-scoped: Security rule ensures users can only delete their own logs.
 * Recompute meal plan checked status (syncItemLoggedState) on best effort.
 */
export async function deleteFoodLog(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id < 1) {
      return errorResponse(res, 'Invalid log ID', 400, 'VALIDATION_ERROR');
    }

    const userId = req.user.userId;

    // Fetch the log first to get food_id, log_date, and meal_type
    const log = await foodRepo.getFoodLogById(id, userId);
    if (!log) {
      return errorResponse(res, 'Food log entry not found', 404, 'NOT_FOUND');
    }

    // Delete the entry
    await foodRepo.deleteFoodLogById(id, userId);

    // Recompute the daily meal plan checked status (best effort)
    try {
      if (log.food_id) {
        const dateStr = log.log_date instanceof Date
          ? log.log_date.toISOString().split('T')[0]
          : String(log.log_date).split('T')[0];
        await syncItemLoggedState(userId, dateStr, log.meal_type, log.food_id);
        clearCachedPlan(userId, dateStr, 'meal');
      }
    } catch (syncErr) {
      console.warn(`[deleteFoodLog] Failed to sync daily meal plan state: ${syncErr.message}`);
    }

    return successResponse(res, null, 200);
  } catch (err) {
    next(err);
  }
}

