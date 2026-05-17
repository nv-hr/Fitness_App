import * as foodRepo from '../repositories/food.repository.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { ValidationError } from '../utils/errors.js';
import { calculateCalories, validateFoodData } from '../services/food.service.js';
import { findByUserId as findProfileByUserId } from '../repositories/profile.repository.js';
import { calculateTdee, getCalorieTarget } from '../services/profile.service.js';

const VALID_MEAL_TYPES = ['sarapan', 'makan_siang', 'makan_malam', 'camilan'];

/**
 * GET /api/food/search?q= — Search foods by name (FOOD-01, FOOD-02).
 */
export async function searchFoods(req, res) {
  try {
    const q = req.query.q;
    if (!q || q.length < 2) {
      return errorResponse(res, 'Pencarian minimal 2 karakter', 400, 'VALIDATION_ERROR');
    }
    const foods = await foodRepo.searchFoods(req.user.userId, q);
    return successResponse(res, foods);
  } catch (err) {
    if (err instanceof ValidationError) {
      return errorResponse(res, err.message, 400, 'VALIDATION_ERROR');
    }
    // Pass database errors to global handler
    res.status(500).json({ success: false, error: { message: err.message, code: err.name } });
  }
}

/**
 * POST /api/food — Create custom food for authenticated user (FOOD-03).
 */
export async function createCustomFood(req, res, next) {
  try {
    const { name, calories_per_100g, category } = req.body;
    validateFoodData({ name, calories_per_100g, category });
    const food = await foodRepo.createCustomFood(req.user.userId, { name, calories_per_100g, category });
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
      return errorResponse(res, 'Porsi harus antara 1-5000 gram', 400, 'VALIDATION_ERROR');
    }

    // Validate meal type
    if (!mealType || !VALID_MEAL_TYPES.includes(mealType)) {
      return errorResponse(res, 'Jenis makanan tidak valid', 400, 'VALIDATION_ERROR');
    }

    // Default logDate to today
    const logDateValue = logDate || new Date().toISOString().split('T')[0];

    let calories;
    if (foodId) {
      // Seeded food: calculate server-side from calories_per_100g (T-04-06)
      const food = await foodRepo.getFoodById(foodId);
      if (!food) {
        return errorResponse(res, 'Makanan tidak ditemukan', 404, 'NOT_FOUND');
      }
      calories = calculateCalories(food.calories_per_100g, portionGrams);
    } else if (customFoodName) {
      // Custom one-off: use client-supplied calories
      if (!clientCalories || clientCalories < 0) {
        return errorResponse(res, 'Kalori wajib diisi', 400, 'VALIDATION_ERROR');
      }
      calories = clientCalories;
    } else {
      return errorResponse(res, 'foodId atau customFoodName wajib diisi', 400, 'VALIDATION_ERROR');
    }

    const log = await foodRepo.createFoodLog(req.user.userId, {
      foodId,
      customFoodName,
      calories,
      portionGrams,
      logDate: logDateValue,
      mealType,
    });

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

    // Get total consumed
    const totalConsumed = await foodRepo.getDailyTotal(req.user.userId, date);

    // Get user profile for calorie target calculation
    const profile = await findProfileByUserId(req.user.userId);
    let calorieTarget = null;
    if (profile) {
      const tdee = calculateTdee(profile.weight_kg, profile.height_cm, profile.age, profile.gender, profile.activity_level);
      if (tdee) {
        calorieTarget = getCalorieTarget(tdee, profile.fitness_goal);
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

export default {
  searchFoods,
  createCustomFood,
  logFood,
  getDailySummary,
  getDailyLogs,
  getLogHistory,
  getRecentFoods,
};
