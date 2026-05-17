import * as profileService from '../services/profile.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { ValidationError } from '../utils/errors.js';

/**
 * POST /api/profile — Create profile (first-time setup).
 */
export async function createProfile(req, res, next) {
  try {
    const userId = req.user.userId;
    const { weightKg, heightCm, age, gender, fitnessGoal } = req.body;

    const { profile, bmi, bmiCategory } = await profileService.createProfile(userId, {
      weightKg,
      heightCm,
      age,
      gender,
      fitnessGoal,
    });

    return successResponse(res, { profile, bmi, bmiCategory }, 201);
  } catch (err) {
    if (err instanceof ValidationError) {
      return errorResponse(res, err.message, 400, 'VALIDATION_ERROR');
    }
    next(err);
  }
}

/**
 * GET /api/profile — Get existing profile.
 */
export async function getProfile(req, res, next) {
  try {
    const userId = req.user.userId;
    const result = await profileService.getProfile(userId);

    if (!result) {
      return errorResponse(res, 'Profile not found', 404, 'NOT_FOUND');
    }

    return successResponse(res, result);
  } catch (err) {
    if (err instanceof ValidationError) {
      return errorResponse(res, err.message, 400, 'VALIDATION_ERROR');
    }
    next(err);
  }
}

/**
 * PUT /api/profile — Update profile.
 */
export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.userId;
    const { weightKg, heightCm, age, gender, fitnessGoal } = req.body;

    const { profile, bmi, bmiCategory } = await profileService.updateProfile(userId, {
      weightKg,
      heightCm,
      age,
      gender,
      fitnessGoal,
    });

    return successResponse(res, { profile, bmi, bmiCategory });
  } catch (err) {
    if (err instanceof ValidationError) {
      return errorResponse(res, err.message, 400, 'VALIDATION_ERROR');
    }
    next(err);
  }
}

export default { createProfile, getProfile, updateProfile };
