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
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor formula.
 * Male: 10 × weightKg + 6.25 × heightCm - 5 × age + 5
 * Female: 10 × weightKg + 6.25 × heightCm - 5 × age - 161
 * Other: use male formula
 * @param {number} weightKg
 * @param {number} heightCm
 * @param {number} age
 * @param {string} gender
 * @returns {number} BMR (unrounded)
 */
export function calculateBmr(weightKg, heightCm, age, gender) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'female') return base - 161;
  return base + 5; // male and other
}

/**
 * Calculate Total Daily Energy Expenditure.
 * Activity multipliers: low=1.2, medium=1.55, high=1.9
 * @param {number} weightKg
 * @param {number} heightCm
 * @param {number} age
 * @param {string} gender
 * @param {string|null} activityLevel
 * @returns {number|null} TDEE rounded, or null if no activity level
 */
export function calculateTdee(weightKg, heightCm, age, gender, activityLevel) {
  if (!activityLevel) return null;
  const multipliers = { low: 1.2, medium: 1.55, high: 1.9 };
  const multiplier = multipliers[activityLevel];
  if (!multiplier) return null;
  const bmr = calculateBmr(weightKg, heightCm, age, gender);
  return Math.round(bmr * multiplier);
}

/**
 * Get TDEE range (±10%).
 * @param {number} tdee
 * @returns {{min: number, max: number}}
 */
export function getTdeeRange(tdee) {
  return { min: Math.round(tdee * 0.9), max: Math.round(tdee * 1.1) };
}

/**
 * Get calorie target adjusted for fitness goal.
 * lose_weight: -500, maintain: 0, gain_weight: +300
 * @param {number} tdee
 * @param {string} fitnessGoal
 * @returns {number}
 */
export function getCalorieTarget(tdee, fitnessGoal) {
  const adjustments = { lose_weight: -500, maintain: 0, gain_weight: 300 };
  const adjustment = adjustments[fitnessGoal] || 0;
  return Math.round(tdee + adjustment);
}

/**
 * Validate profile data fields.
 * @param {Object} data
 */
function validateProfileData(data) {
  const { weightKg, heightCm, age, gender, fitnessGoal } = data;

  if (weightKg == null || weightKg < 2 || weightKg > 300) {
    throw new ValidationError('Weight must be between 2-300 kg');
  }
  if (heightCm == null || heightCm < 50 || heightCm > 250) {
    throw new ValidationError('Height must be between 50-250 cm');
  }
  if (age == null || age < 5 || age > 120) {
    throw new ValidationError('Age must be between 5-120 years');
  }
  if (!['male', 'female', 'other'].includes(gender)) {
    throw new ValidationError('Gender must be male, female, or other');
  }
  if (!['lose_weight', 'maintain', 'gain_weight'].includes(fitnessGoal)) {
    throw new ValidationError('Fitness goal must be lose_weight, maintain, or gain_weight');
  }
}

/**
 * Create a new profile for a user.
 * @param {number} userId
 * @param {Object} profileData
 * @returns {Promise<{profile: Object, bmi: number, bmiCategory: string, tdee: number|null, tdeeRange: Object|null, calorieTarget: number|null}>}
 */
export async function createProfile(userId, profileData) {
  validateProfileData(profileData);

  const { weightKg, heightCm, age, gender, fitnessGoal, activityLevel } = profileData;

  const profile = await createProfileRepo({
    userId,
    weightKg,
    heightCm,
    age,
    gender,
    fitnessGoal,
    activityLevel,
  });

  const bmi = calculateBmi(weightKg, heightCm);
  const bmiCategory = getBmiCategory(bmi);

  const tdee = calculateTdee(weightKg, heightCm, age, gender, activityLevel);
  const tdeeRange = tdee ? getTdeeRange(tdee) : null;
  const calorieTarget = (tdee && fitnessGoal) ? getCalorieTarget(tdee, fitnessGoal) : null;

  return { profile, bmi, bmiCategory, tdee, tdeeRange, calorieTarget };
}

/**
 * Get a user's profile with computed BMI.
 * @param {number} userId
 * @returns {Promise<{profile: Object, bmi: number, bmiCategory: string, tdee: number|null, tdeeRange: Object|null, calorieTarget: number|null}|null>}
 */
export async function getProfile(userId) {
  const profile = await findByUserId(userId);
  if (!profile) return null;

  const bmi = calculateBmi(profile.weight_kg, profile.height_cm);
  const bmiCategory = getBmiCategory(bmi);

  const tdee = calculateTdee(profile.weight_kg, profile.height_cm, profile.age, profile.gender, profile.activity_level);
  const tdeeRange = tdee ? getTdeeRange(tdee) : null;
  const calorieTarget = (tdee && profile.fitness_goal) ? getCalorieTarget(tdee, profile.fitness_goal) : null;

  return { profile, bmi, bmiCategory, tdee, tdeeRange, calorieTarget };
}

/**
 * Update a user's profile and return updated data with BMI.
 * @param {number} userId
 * @param {Object} profileData
 * @returns {Promise<{profile: Object, bmi: number, bmiCategory: string, tdee: number|null, tdeeRange: Object|null, calorieTarget: number|null}>}
 */
export async function updateProfile(userId, profileData) {
  validateProfileData(profileData);

  const { weightKg, heightCm, age, gender, fitnessGoal, activityLevel } = profileData;

  await updateByUserId(userId, { weightKg, heightCm, age, gender, fitnessGoal, activityLevel });

  return getProfile(userId);
}
