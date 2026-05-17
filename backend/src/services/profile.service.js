import {
  create as createProfileRepo,
  findByUserId,
  updateByUserId,
} from '../repositories/profile.repository.js';
import { ValidationError } from '../utils/errors.js';

/**
 * Calculate BMI from weight (kg) and height (cm).
 * Per D-13: heightM = heightCm / 100, bmi = weightKg / (heightM * heightM)
 * @param {number} weightKg
 * @param {number} heightCm
 * @returns {number} BMI rounded to 1 decimal place
 */
export function calculateBmi(weightKg, heightCm) {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

/**
 * Get BMI category using Asian-Pacific cutoffs (per D-14).
 * underweight < 18.5, normal 18.5-22.9, overweight 23-24.9, obese >= 25
 * @param {number} bmi
 * @returns {string}
 */
export function getBmiCategory(bmi) {
  if (bmi < 18.5) return 'underweight';
  if (bmi <= 22.9) return 'normal';
  if (bmi <= 24.9) return 'overweight';
  return 'obese';
}

/**
 * Validate profile data fields.
 * @param {Object} data
 */
function validateProfileData(data) {
  const { weightKg, heightCm, age, gender, fitnessGoal } = data;

  if (weightKg == null || weightKg < 2 || weightKg > 300) {
    throw new ValidationError('Berat badan harus antara 2-300 kg');
  }
  if (heightCm == null || heightCm < 50 || heightCm > 250) {
    throw new ValidationError('Tinggi badan harus antara 50-250 cm');
  }
  if (age == null || age < 5 || age > 120) {
    throw new ValidationError('Umur harus antara 5-120 tahun');
  }
  if (!['male', 'female', 'other'].includes(gender)) {
    throw new ValidationError('Jenis kelamin harus male, female, atau other');
  }
  if (!['lose_weight', 'maintain', 'gain_weight'].includes(fitnessGoal)) {
    throw new ValidationError('Tujuan fitness harus lose_weight, maintain, atau gain_weight');
  }
}

/**
 * Create a new profile for a user.
 * @param {number} userId
 * @param {Object} profileData
 * @returns {Promise<{profile: Object, bmi: number, bmiCategory: string}>}
 */
export async function createProfile(userId, profileData) {
  validateProfileData(profileData);

  const { weightKg, heightCm, age, gender, fitnessGoal } = profileData;

  const profile = await createProfileRepo({
    userId,
    weightKg,
    heightCm,
    age,
    gender,
    fitnessGoal,
  });

  const bmi = calculateBmi(weightKg, heightCm);
  const bmiCategory = getBmiCategory(bmi);

  return { profile, bmi, bmiCategory };
}

/**
 * Get a user's profile with computed BMI.
 * @param {number} userId
 * @returns {Promise<{profile: Object, bmi: number, bmiCategory: string}|null>}
 */
export async function getProfile(userId) {
  const profile = await findByUserId(userId);
  if (!profile) return null;

  const bmi = calculateBmi(profile.weight_kg, profile.height_cm);
  const bmiCategory = getBmiCategory(bmi);

  return { profile, bmi, bmiCategory };
}

/**
 * Update a user's profile and return updated data with BMI.
 * @param {number} userId
 * @param {Object} profileData
 * @returns {Promise<{profile: Object, bmi: number, bmiCategory: string}>}
 */
export async function updateProfile(userId, profileData) {
  validateProfileData(profileData);

  const { weightKg, heightCm, age, gender, fitnessGoal } = profileData;

  await updateByUserId(userId, { weightKg, heightCm, age, gender, fitnessGoal });

  return getProfile(userId);
}
