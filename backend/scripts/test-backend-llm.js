#!/usr/bin/env node
/**
 * BACKEND LLM DIAGNOSTIC — Service-Level End-to-End Test
 *
 * Calls the REAL backend service functions (generateActivityPlan, generateDailyMealPlan)
 * through their dependency injection pattern, exercising the full production pipeline:
 * prompt building → LLM API call → structure validation → name validation/fixing →
 * caching → DB persistence attempt.
 *
 * KEY DIFFERENCE FROM test-llm-output.js:
 *   test-llm-output.js: builds prompts manually, calls LLM directly, bypasses service layer
 *   test-backend-llm.js: imports and calls REAL service functions, exercises REAL validation,
 *                        REAL caching, REAL fallback handling — the exact same code paths
 *                        used when a user clicks "Generate Plan" in the app
 *
 * Mock DB data is injected through the service functions' dependency injection pattern,
 * while everything else (LLM call, validation, name fixing, cache) runs real production code.
 *
 * Usage:
 *   node backend/scripts/test-backend-llm.js
 *
 * Exit code: 0 always (diagnostic, not pass/fail)
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

// ── Module-level setup ─────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── Dynamic imports (after dotenv so env vars are available at import time) ─────
let buildPrompt;
let fuzzyMatchActivityName;
let fuzzyMatchFoodName;

let generateActivityPlan, validateActivityPlanStructure;
let generateDailyMealPlan, validateDailyMealPlanStructure, validateAndFixDailyMealPlan;
let validateAndFixPlan; // from llm.service.js — the old weekly plan name fixer (for diagnostic comparison)

try {
  const llmModule = await import('../src/services/llm.service.js');
  buildPrompt = llmModule.buildPrompt;
  validateAndFixPlan = llmModule.validateAndFixPlan;
  fuzzyMatchActivityName = llmModule.fuzzyMatchActivityName;

  const apModule = await import('../src/services/activityPlan.service.js');
  generateActivityPlan = apModule.generateActivityPlan;
  validateActivityPlanStructure = apModule.validateActivityPlanStructure;

  const mpModule = await import('../src/services/dailyMealPlan.service.js');
  generateDailyMealPlan = mpModule.generateDailyMealPlan;
  validateDailyMealPlanStructure = mpModule.validateDailyMealPlanStructure;
  validateAndFixDailyMealPlan = mpModule.validateAndFixDailyMealPlan;

  const foodUtils = await import('../src/utils/food.js');
  fuzzyMatchFoodName = foodUtils.fuzzyMatchFoodName;
} catch (importErr) {
  console.error('FATAL: Failed to import service modules:', importErr.message);
  process.exit(0);
}

// ── Helper functions ────────────────────────────────────────────────────────────

/** Format a Date as YYYY-MM-DD */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/** Generate 14 days of sample activity history (same format as test-llm-output.js) */
function generateSampleActivityHistory() {
  const entries = [
    { name: 'Walking', duration: 30, intensity: 'moderate' },
    { name: 'Running', duration: 25, intensity: 'vigorous' },
    { name: 'Yoga', duration: 45, intensity: 'light' },
    { name: 'Cycling', duration: 40, intensity: 'moderate' },
    { name: 'Walking', duration: 45, intensity: 'light' },
    { name: 'Strength Training', duration: 35, intensity: 'vigorous' },
    { name: 'Swimming', duration: 30, intensity: 'moderate' },
    { name: 'Cycling', duration: 50, intensity: 'vigorous' },
    { name: 'Walking', duration: 20, intensity: 'light' },
    { name: 'Yoga', duration: 60, intensity: 'light' },
    { name: 'Running', duration: 30, intensity: 'moderate' },
    { name: 'Strength Training', duration: 40, intensity: 'moderate' },
    { name: 'Walking', duration: 35, intensity: 'moderate' },
    { name: 'Cycling', duration: 30, intensity: 'light' },
  ];

  const today = new Date();
  const history = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const entry = entries[i % entries.length];
    history.push({
      log_date: formatDate(date),
      activity_name: entry.name,
      duration_min: entry.duration,
      intensity: entry.intensity,
    });
  }
  return history;
}

/** Generate 12 sample activities (same set as test-llm-output.js) */
function generateSampleActivities() {
  return [
    { id: 1, name: 'Walking', estimated_calories: 200, duration_min: 30 },
    { id: 2, name: 'Running', estimated_calories: 350, duration_min: 30 },
    { id: 3, name: 'Yoga', estimated_calories: 150, duration_min: 45 },
    { id: 4, name: 'Cycling', estimated_calories: 300, duration_min: 30 },
    { id: 5, name: 'Swimming', estimated_calories: 400, duration_min: 30 },
    { id: 6, name: 'Strength Training', estimated_calories: 250, duration_min: 30 },
    { id: 7, name: 'Pilates', estimated_calories: 180, duration_min: 45 },
    { id: 8, name: 'HIIT', estimated_calories: 450, duration_min: 20 },
    { id: 9, name: 'Dancing', estimated_calories: 280, duration_min: 30 },
    { id: 10, name: 'Rowing Machine', estimated_calories: 320, duration_min: 30 },
    { id: 11, name: 'Elliptical', estimated_calories: 270, duration_min: 30 },
    { id: 12, name: 'Stretching', estimated_calories: 100, duration_min: 20 },
  ];
}

/** Generate 17 sample foods (same set as test-llm-output.js) */
function generateSampleFoods() {
  return [
    { id: 1, name: 'Chicken Breast', calories_per_100g: 165, category: 'protein' },
    { id: 2, name: 'Salmon', calories_per_100g: 208, category: 'protein' },
    { id: 3, name: 'Eggs', calories_per_100g: 155, category: 'protein' },
    { id: 4, name: 'Greek Yogurt', calories_per_100g: 59, category: 'dairy' },
    { id: 5, name: 'Banana', calories_per_100g: 89, category: 'fruits' },
    { id: 6, name: 'Apple', calories_per_100g: 52, category: 'fruits' },
    { id: 7, name: 'Oatmeal', calories_per_100g: 71, category: 'carbs' },
    { id: 8, name: 'Brown Rice', calories_per_100g: 111, category: 'carbs' },
    { id: 9, name: 'Broccoli', calories_per_100g: 34, category: 'vegetables' },
    { id: 10, name: 'Sweet Potato', calories_per_100g: 86, category: 'carbs' },
    { id: 11, name: 'Almonds', calories_per_100g: 579, category: 'protein' },
    { id: 12, name: 'Spinach', calories_per_100g: 23, category: 'vegetables' },
    { id: 13, name: 'Tuna', calories_per_100g: 130, category: 'protein' },
    { id: 14, name: 'Quinoa', calories_per_100g: 120, category: 'carbs' },
    { id: 15, name: 'Avocado', calories_per_100g: 160, category: 'fruits' },
    { id: 16, name: 'Milk', calories_per_100g: 42, category: 'dairy' },
    { id: 17, name: 'Whey Protein', calories_per_100g: 400, category: 'protein' },
  ];
}

/** Generate 5 days of sample food logs */
function generateSampleFoodLogs() {
  const today = new Date();
  const logs = [];
  const sampleCalories = [1850, 2100, 1750, 2200, 1950];
  const sampleCounts = [4, 5, 3, 5, 4];
  for (let i = 4; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    logs.push({
      log_date: formatDate(date),
      total_calories: sampleCalories[i],
      entry_count: sampleCounts[i],
    });
  }
  return logs;
}

/**
 * Build the same activity plan prompt that generateActivityPlan() builds internally.
 * This uses the real buildPrompt() from llm.service.js with the same variable mappings
 * that buildActivityPlanPrompt() uses in activityPlan.service.js.
 */
function buildActivityPlanPromptManually(profile, dbActivities, activityHistory, planDate) {
  const activitiesText = dbActivities.map(a =>
    `- ID ${a.id}: ${a.name} (${a.estimated_calories} cal, ~${a.duration_min}min)`
  ).join('\n');
  const historyText = activityHistory && activityHistory.length > 0
    ? activityHistory.slice(-10).map(a =>
        `- ${a.log_date || a.loggedDate || ''}: ${a.activity_name} (${a.duration_min}min, ${a.intensity})`
      ).join('\n')
    : 'No recent activity history.';
  const topNames = activityHistory && activityHistory.length > 0
    ? [...new Set(activityHistory.map(a => a.activity_name || a.activityName).filter(Boolean))].slice(0, 5).join(', ')
    : '';
  return buildPrompt('system-prompt.md', {
    weightKg: String(profile.weight_kg || profile.weightKg || ''),
    heightCm: String(profile.height_cm || profile.heightCm || ''),
    age: String(profile.age || ''),
    gender: profile.gender || '',
    fitnessGoal: profile.fitness_goal || profile.fitnessGoal || '',
    activityLevel: profile.activity_level || 'sedentary',
    calorieTarget: String(profile.calorieTarget || profile.calorie_target || ''),
    bmr: String(profile.bmr || ''),
    activityHistory: historyText,
    topActivityNames: topNames,
    availableActivities: activitiesText,
    weekStartDate: planDate,
  });
}

/**
 * Build the same meal plan prompt that generateDailyMealPlan() builds internally.
 */
function buildDailyMealPlanPromptManually(profile, dbFoods, recentLogs, planDate, calorieTarget) {
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

/** Format milliseconds as seconds with 2 decimal places */
function formatDuration(ms) {
  return (ms / 1000).toFixed(2) + 's';
}

/** Truncate a string to a given length, adding ellipsis if truncated */
function truncate(str, maxLen) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen) + '...';
}

// ── Main diagnostic ────────────────────────────────────────────────────────────

async function main() {
  const ENV = {
    model: process.env.LLM_MODEL || 'openrouter/owl-alpha',
    apiKeySet: !!process.env.OPENROUTER_API_KEY,
    apiKeyPrefix: process.env.OPENROUTER_API_KEY
      ? process.env.OPENROUTER_API_KEY.substring(0, 8) + '...'
      : 'N/A',
  };

  console.log('============================================================');
  console.log('BACKEND LLM DIAGNOSTIC — Service-Level Test');
  console.log('============================================================');
  console.log();
  console.log('Model:          ' + ENV.model);
  console.log('API key set:    ' + (ENV.apiKeySet ? 'YES' : 'NO'));
  console.log('API key prefix: ' + ENV.apiKeyPrefix);
  console.log();

  // ───────────────────────────────────────────────────────────────────────────────
  // SECTION 1: HTTP Connectivity Check
  // ───────────────────────────────────────────────────────────────────────────────

  console.log('============================================================');
  console.log('1. HTTP CONNECTIVITY CHECK');
  console.log('============================================================');
  console.log();

  let serverReachable = false;
  let httpStatus = null;
  let httpBody = null;
  let httpError = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch('http://localhost:3001/api/health', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    serverReachable = true;
    httpStatus = resp.status;
    httpBody = await resp.text();
    console.log('  Endpoint: http://localhost:3001/api/health');
    console.log('  Status:   ' + resp.status + ' ' + resp.statusText);
    console.log('  Body:     ' + truncate(httpBody, 200));
  } catch (err) {
    httpError = err.code || err.message;
    console.log('  Endpoint: http://localhost:3001/api/health');
    console.log('  Status:   NOT REACHABLE');
    console.log('  Error:    ' + httpError);
  }
  console.log();

  // ───────────────────────────────────────────────────────────────────────────────
  // SECTION 2: Activity Plan — Service-Level Test
  // ───────────────────────────────────────────────────────────────────────────────

  console.log('============================================================');
  console.log('2. ACTIVITY PLAN — Service-Level Test');
  console.log('============================================================');
  console.log();

  // Shared sample data
  const sampleProfile = {
    weight_kg: 75,
    height_cm: 180,
    age: 28,
    gender: 'male',
    fitness_goal: 'lose weight',
    activity_level: 'moderate',
  };
  const sampleActivityHistory = generateSampleActivityHistory();
  const sampleActivities = generateSampleActivities();
  const todayStr = formatDate(new Date());

  // ── 2a. Build and display the rendered prompt (what the service sends to the LLM) ──

  console.log('---- 2a. Rendered Prompt (preview) ----');
  console.log();

  let activityPrompt = '(error building prompt)';
  let activityPromptBuildError = null;
  try {
    activityPrompt = buildActivityPlanPromptManually(
      sampleProfile, sampleActivities, sampleActivityHistory, todayStr
    );
  } catch (err) {
    activityPromptBuildError = err.message;
    console.error('[ERROR] Failed to build activity plan prompt: ' + err.message);
  }

  if (!activityPromptBuildError) {
    console.log('  Total length: ' + activityPrompt.length + ' characters');
    console.log();
    console.log('  [FIRST 600 CHARS]:');
    console.log('  ' + activityPrompt.substring(0, 600).replace(/\n/g, '\n  '));
    console.log();
    console.log('  [LAST 600 CHARS]:');
    console.log('  ' + activityPrompt.substring(Math.max(0, activityPrompt.length - 600)).replace(/\n/g, '\n  '));
  }
  console.log();

  // ── 2b. Call the REAL generateActivityPlan() service function ──

  console.log('---- 2b. Calling generateActivityPlan() with mock DB data ----');
  console.log();

  const activityDeps = {
    getProfile: async (userId) => ({ profile: sampleProfile }),
    getAllActivities: async (userId) => sampleActivities,
    getActivityHistory: async (userId, days) => sampleActivityHistory,
    userId: 1,
    planDate: todayStr,
  };

  let activityResult = null;
  let activityDuration = 0;
  let activityCallError = null;

  const t0 = performance.now();
  try {
    console.log('  Injecting DI deps: getProfile, getAllActivities, getActivityHistory');
    console.log('  Calling generateActivityPlan({ userId: 1, planDate: "' + todayStr + '", ... })');
    console.log();
    activityResult = await generateActivityPlan(activityDeps);
    activityDuration = performance.now() - t0;
  } catch (err) {
    activityDuration = performance.now() - t0;
    activityCallError = err.message;
    console.error('[FATAL] generateActivityPlan threw: ' + err.message);
  }

  // ── 2c. Request details ──

  console.log('---- 2c. Request ----');
  console.log();
  console.log('  User ID:             1');
  console.log('  Plan date:           ' + todayStr);
  console.log('  Profile:             ' + sampleProfile.weight_kg + 'kg, ' + sampleProfile.height_cm + 'cm, '
    + sampleProfile.age + 'yo, ' + sampleProfile.gender + ', ' + sampleProfile.fitness_goal);
  console.log('  Available activities: ' + sampleActivities.length);
  console.log('  Activity history:     ' + sampleActivityHistory.length + ' entries');
  console.log();

  // ── 2d. Result Summary ──

  console.log('---- 2d. Result Summary ----');
  console.log();

  if (activityCallError) {
    console.log('  Status:       ERROR');
    console.log('  Error:        ' + activityCallError);
    console.log('  Duration:     ' + formatDuration(activityDuration));
  } else if (activityResult) {
    const plan = activityResult.plan;
    console.log('  Status:       ' + activityResult.status);
    console.log('  From cache:   ' + activityResult.fromCache);
    console.log('  LLM model:    ' + (plan.llm_model || 'unknown'));
    console.log('  Duration:     ' + formatDuration(activityDuration));
  } else {
    console.log('  Status:       NO RESULT');
  }
  console.log();

  // ── 2e. Generated Plan Details ──

  console.log('---- 2e. Generated Plan ----');
  console.log();

  if (activityResult && activityResult.plan) {
    const plan = activityResult.plan;

    if (Array.isArray(plan.activities)) {
      // New format (single-day plan)
      console.log('  Date: ' + todayStr + ' (' + ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(todayStr + 'T00:00:00Z').getDay()] + ')');
      console.log('  Activities: ' + plan.activities.length + ' total');
      console.log();
      plan.activities.forEach((act, i) => {
        const calStr = act.calories_burned != null ? ', ' + act.calories_burned + ' cal burned' : '';
        console.log('  ' + (i + 1) + '. ' + act.name + ' (' + act.duration_min + 'min, ' + act.intensity + calStr + ')');
      });
      console.log();
      console.log('  Activity variety: ' + [...new Set(plan.activities.map(a => a.name))].join(', '));
    } else if (Array.isArray(plan.days)) {
      // Legacy weekly format (unlikely but handle it)
      console.log('  [Weekly format — ' + plan.days.length + ' days]');
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      plan.days.forEach((day, i) => {
        const d = new Date(day.date + 'T00:00:00Z');
        console.log('  Day ' + (i + 1) + ' (' + day.date + ', ' + dayNames[d.getDay()] + '):');
        if (Array.isArray(day.activities)) {
          day.activities.forEach((act) => {
            console.log('    - ' + act.name + ' (' + act.duration_min + 'min, ' + act.intensity + ')');
          });
        }
      });
    } else if (plan.status === 'fallback' || plan.status === 'unavailable') {
      console.log('  [FALLBACK PLAN — LLM API may not have been called]');
      if (plan.message) console.log('  Message: ' + plan.message);
      if (Array.isArray(plan.activities)) {
        plan.activities.forEach((act, i) => {
          console.log('  ' + (i + 1) + '. ' + act.name + ' (' + act.duration_min + 'min, ' + act.intensity + ')');
        });
      }
    } else {
      console.log('  [Unknown plan format — keys: ' + Object.keys(plan).join(', ') + ']');
    }
  } else {
    console.log('  [No plan returned]');
  }
  console.log();

  // ── 2f. Validation Results (independent validation using the same functions the service uses) ──

  console.log('---- 2f. Validation Results ----');
  console.log();

  if (activityResult && activityResult.plan && Array.isArray(activityResult.plan.activities)) {
    // Structure validation (same function called by generateActivityPlan internally)
    const structCheck = validateActivityPlanStructure(activityResult.plan, todayStr);
    console.log('  Activity structure validation: ' + (structCheck.valid ? '✓ PASS' : '✗ FAIL'));
    if (structCheck.errors.length > 0) {
      structCheck.errors.forEach(e => console.log('    → ' + e));
    }

    // Activity name matching (diagnostic only — the service doesn't call name fixing for activities)
    console.log();
    console.log('  Activity name matching:');
    if (validateAndFixPlan && fuzzyMatchActivityName) {
      const nameResult = validateAndFixPlan(
        { days: [{ date: todayStr, activities: activityResult.plan.activities }] },
        sampleActivities
      );
      const allFuzzy = [];
      if (nameResult.plan && nameResult.plan.days) {
        for (const day of nameResult.plan.days) {
          if (!Array.isArray(day.activities)) continue;
          for (const act of day.activities) {
            const match = fuzzyMatchActivityName(act.name, sampleActivities);
            if (match.matched) {
              const tag = match.matchType === 'exact' ? '✓' : '↻';
              allFuzzy.push({ name: act.name, type: match.matchType, id: match.activity.id });
              console.log('    ' + tag + ' "' + act.name + '" → ' + match.matchType
                + ' (id: ' + match.activity.id + ')');
            } else {
              allFuzzy.push({ name: act.name, type: 'none', id: null });
              console.log('    ✗ "' + act.name + '" → NOT FOUND in DB');
            }
          }
        }
      }
      const fuzzyCount = allFuzzy.filter(f => f.type !== 'exact' && f.type !== 'none').length;
      const missingCount = allFuzzy.filter(f => f.type === 'none').length;
      console.log();
      console.log('  Summary: ' + allFuzzy.length + ' total, '
        + (allFuzzy.length - fuzzyCount - missingCount) + ' exact, '
        + fuzzyCount + ' fuzzy, '
        + missingCount + ' missing');
    }
  } else if (activityResult && (activityResult.status === 'fallback' || !activityResult.plan)) {
    console.log('  Validation: SKIPPED (status: ' + activityResult.status + ')');
  } else if (activityCallError) {
    console.log('  Validation: SKIPPED (call error)');
  } else {
    console.log('  Validation: SKIPPED (no activities array in plan)');
  }
  console.log();

  // ───────────────────────────────────────────────────────────────────────────────
  // SECTION 3: Daily Meal Plan — Service-Level Test
  // ───────────────────────────────────────────────────────────────────────────────

  console.log('============================================================');
  console.log('3. DAILY MEAL PLAN — Service-Level Test');
  console.log('============================================================');
  console.log();

  const sampleFoods = generateSampleFoods();
  const sampleFoodLogs = generateSampleFoodLogs();
  const calorieTarget = 2000;

  // ── 3a. Build and display the rendered prompt (preview) ──

  console.log('---- 3a. Rendered Prompt (preview) ----');
  console.log();

  let mealPrompt = '(error building prompt)';
  let mealPromptBuildError = null;
  try {
    mealPrompt = buildDailyMealPlanPromptManually(
      sampleProfile, sampleFoods, sampleFoodLogs, todayStr, calorieTarget
    );
  } catch (err) {
    mealPromptBuildError = err.message;
    console.error('[ERROR] Failed to build meal plan prompt: ' + err.message);
  }

  if (!mealPromptBuildError) {
    console.log('  Total length: ' + mealPrompt.length + ' characters');
    console.log();
    console.log('  [FIRST 600 CHARS]:');
    console.log('  ' + mealPrompt.substring(0, 600).replace(/\n/g, '\n  '));
    console.log();
    console.log('  [LAST 600 CHARS]:');
    console.log('  ' + mealPrompt.substring(Math.max(0, mealPrompt.length - 600)).replace(/\n/g, '\n  '));
  }
  console.log();

  // ── 3b. Call the REAL generateDailyMealPlan() service function ──

  console.log('---- 3b. Calling generateDailyMealPlan() with mock DB data ----');
  console.log();

  const mealDeps = {
    getProfile: async (userId) => ({
      profile: sampleProfile,
      calorieTarget,
    }),
    getAllFoods: async (userId) => sampleFoods,
    getLogHistory: async (userId, days) => sampleFoodLogs,
    userId: 1,
    planDate: todayStr,
  };

  let mealResult = null;
  let mealDuration = 0;
  let mealCallError = null;

  const t1 = performance.now();
  try {
    console.log('  Injecting DI deps: getProfile, getAllFoods, getLogHistory');
    console.log('  Calling generateDailyMealPlan({ userId: 1, planDate: "' + todayStr + '", ... })');
    console.log();
    mealResult = await generateDailyMealPlan(mealDeps);
    mealDuration = performance.now() - t1;
  } catch (err) {
    mealDuration = performance.now() - t1;
    mealCallError = err.message;
    console.error('[FATAL] generateDailyMealPlan threw: ' + err.message);
  }

  // ── 3c. Request details ──

  console.log('---- 3c. Request ----');
  console.log();
  console.log('  User ID:          1');
  console.log('  Plan date:        ' + todayStr);
  console.log('  Profile:          ' + sampleProfile.weight_kg + 'kg, ' + sampleProfile.height_cm + 'cm, '
    + sampleProfile.age + 'yo, ' + sampleProfile.gender + ', ' + sampleProfile.fitness_goal);
  console.log('  Calorie target:   ' + calorieTarget + ' kcal');
  console.log('  Available foods:  ' + sampleFoods.length);
  console.log('  Food log history: ' + sampleFoodLogs.length + ' days');
  console.log();

  // ── 3d. Result Summary ──

  console.log('---- 3d. Result Summary ----');
  console.log();

  if (mealCallError) {
    console.log('  Status:       ERROR');
    console.log('  Error:        ' + mealCallError);
    console.log('  Duration:     ' + formatDuration(mealDuration));
  } else if (mealResult) {
    const plan = mealResult.plan;
    console.log('  Status:       ' + mealResult.status);
    console.log('  From cache:   ' + mealResult.fromCache);
    console.log('  LLM model:    ' + (plan.llm_model || 'unknown'));
    console.log('  Duration:     ' + formatDuration(mealDuration));
  } else {
    console.log('  Status:       NO RESULT');
  }
  console.log();

  // ── 3e. Generated Plan Details ──

  console.log('---- 3e. Generated Plan ----');
  console.log();

  if (mealResult && mealResult.plan) {
    const plan = mealResult.plan;

    if (Array.isArray(plan.meals)) {
      const mealLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
      let totalItems = 0;

      plan.meals.forEach((meal) => {
        const label = mealLabels[meal.meal_type] || meal.meal_type;
        console.log('  ' + label + ' (' + meal.meal_type + '):');
        if (Array.isArray(meal.items) && meal.items.length > 0) {
          meal.items.forEach((item) => {
            totalItems++;
            const calStr = item.calories != null ? ', ' + item.calories + ' cal' : '';
            console.log('    - ' + item.food_name + ' (' + item.portion_grams + 'g' + calStr + ')');
          });
        } else {
          console.log('    (no items)');
        }
        console.log();
      });

      const totalCals = plan.total_calories || plan.meals.reduce(
        (sum, m) => sum + (m.items || []).reduce((s, i) => s + (i.calories || 0), 0), 0
      );
      const target = plan.calorie_target || calorieTarget;
      const pct = target > 0 ? Math.round((totalCals / target) * 100) : 0;

      console.log('  Summary:');
      console.log('    Meals:            ' + plan.meals.length + ' (breakfast, lunch, dinner, snack)');
      console.log('    Total items:      ' + totalItems);
      console.log('    Total calories:   ' + totalCals + ' kcal (' + pct + '% of ' + target + ' target)');
      console.log('    Food variety:     ' + [...new Set(
        plan.meals.reduce((names, m) => [...names, ...(m.items || []).map(i => i.food_name)], [])
      )].join(', '));
    } else if (plan.status === 'fallback') {
      console.log('  [FALLBACK PLAN — template-generated, no LLM call]');
      if (plan.meals) {
        console.log('  Meals: ' + plan.meals.length);
        console.log('  Total calories: ' + plan.total_calories + ' kcal');
      }
    } else {
      console.log('  [Unknown plan format — keys: ' + Object.keys(plan).join(', ') + ']');
    }
  } else {
    console.log('  [No plan returned]');
  }
  console.log();

  // ── 3f. Validation Results ──

  console.log('---- 3f. Validation Results ----');
  console.log();

  if (mealResult && mealResult.plan && Array.isArray(mealResult.plan.meals)) {
    // Structure validation (same function called by the service internally)
    const structCheck = validateDailyMealPlanStructure(mealResult.plan);
    console.log('  Meal structure validation: ' + (structCheck.valid ? '✓ PASS' : '✗ FAIL'));
    if (structCheck.errors.length > 0) {
      structCheck.errors.forEach(e => console.log('    → ' + e));
    }

    // Name validation & fixing (same function called by the service internally)
    console.log();
    const nameResult = validateAndFixDailyMealPlan(JSON.parse(JSON.stringify(mealResult.plan)), sampleFoods);
    console.log('  Food name validation: ' + (nameResult.valid ? '✓ PASS' : '✗ FAIL'));
    if (nameResult.errors.length > 0) {
      nameResult.errors.forEach(e => console.log('    → ' + e));
    }
    if (nameResult.warnings && nameResult.warnings.length > 0) {
      console.log('  Warnings:');
      nameResult.warnings.forEach(w => console.log('    ⚠ ' + w));
    }

    // Individual food name matching details
    console.log();
    console.log('  Individual food matching:');
    let totalItems = 0;
    let fuzzyCount = 0;
    let exactCount = 0;
    for (const meal of mealResult.plan.meals) {
      if (!Array.isArray(meal.items)) continue;
      for (const item of meal.items) {
        totalItems++;
        const match = fuzzyMatchFoodName(item.food_name, sampleFoods);
        const tag = match.matchType === 'exact' ? '✓' : (match.matched ? '↻' : '✗');
        if (match.matched && match.matchType === 'exact') exactCount++;
        else if (match.matched) fuzzyCount++;
        console.log('    ' + tag + ' "' + item.food_name + '" → ' + match.matchType
          + (match.matched ? ' (id: ' + match.food.id + ')' : ' — NOT FOUND'));
      }
    }
    console.log();
    console.log('  Summary: ' + totalItems + ' total, ' + exactCount + ' exact, '
      + fuzzyCount + ' fuzzy, ' + (totalItems - exactCount - fuzzyCount) + ' missing');
  } else if (mealResult && mealResult.status === 'fallback') {
    console.log('  Validation: SKIPPED (fallback plan — template generated)');
  } else if (mealCallError) {
    console.log('  Validation: SKIPPED (call error)');
  } else {
    console.log('  Validation: SKIPPED (no meals array in plan)');
  }
  console.log();

  // ───────────────────────────────────────────────────────────────────────────────
  // SECTION 4: Cache Behavior Verification
  // ───────────────────────────────────────────────────────────────────────────────

  console.log('============================================================');
  console.log('4. CACHE BEHAVIOR VERIFICATION');
  console.log('============================================================');
  console.log();

  // ── 4a. Activity Plan Cache ──

  console.log('---- 4a. Activity Plan Cache ----');
  console.log();

  if (activityResult && !activityCallError) {
    console.log('  First call  fromCache: ' + activityResult.fromCache);
    if (activityResult.fromCache === false) {
      try {
        const tCache = performance.now();
        const cachedResult = await generateActivityPlan(activityDeps);
        const cacheDuration = performance.now() - tCache;
        const cacheOk = cachedResult.fromCache === true;
        console.log('  Second call fromCache: ' + cachedResult.fromCache
          + (cacheOk ? '  ✓ Cache working' : '  ✗ Cache MISSED (expected true)'));
        console.log('  Cache lookup time:    ' + formatDuration(cacheDuration));
      } catch (err) {
        console.log('  Second call ERROR:    ' + err.message);
      }
    } else {
      console.log('  Second call: SKIPPED (first call already hit cache — cache is clearly working)  ✓');
    }
  } else {
    console.log('  Activity cache: SKIPPED (no valid first result)');
  }
  console.log();

  // ── 4b. Meal Plan Cache ──

  console.log('---- 4b. Meal Plan Cache ----');
  console.log();

  if (mealResult && !mealCallError) {
    console.log('  First call  fromCache: ' + mealResult.fromCache);
    if (mealResult.fromCache === false) {
      try {
        const tCache = performance.now();
        const cachedMeal = await generateDailyMealPlan(mealDeps);
        const cacheDuration = performance.now() - tCache;
        const cacheOk = cachedMeal.fromCache === true;
        console.log('  Second call fromCache: ' + cachedMeal.fromCache
          + (cacheOk ? '  ✓ Cache working' : '  ✗ Cache MISSED (expected true)'));
        console.log('  Cache lookup time:    ' + formatDuration(cacheDuration));
      } catch (err) {
        console.log('  Second call ERROR:    ' + err.message);
      }
    } else {
      console.log('  Second call: SKIPPED (first call already hit cache — cache is clearly working)  ✓');
    }
  } else {
    console.log('  Meal cache: SKIPPED (no valid first result)');
  }
  console.log();

  // ───────────────────────────────────────────────────────────────────────────────
  // SECTION 5: Summary — Compact Metrics
  // ───────────────────────────────────────────────────────────────────────────────

  console.log('============================================================');
  console.log('SUMMARY');
  console.log('============================================================');
  console.log();

  console.log('HTTP Backend:');
  console.log('  Server reachable: ' + (serverReachable ? 'YES' : 'NO'));
  if (httpStatus) console.log('  Status:           ' + httpStatus);
  if (httpError) console.log('  Error:            ' + httpError);
  console.log();

  if (activityResult && !activityCallError) {
    const aPlan = activityResult.plan;
    const activityCount = aPlan && Array.isArray(aPlan.activities)
      ? aPlan.activities.length
      : (aPlan && Array.isArray(aPlan.days)
          ? aPlan.days.reduce((s, d) => s + (d.activities ? d.activities.length : 0), 0)
          : 'N/A');
    console.log('Activity Plan:');
    console.log('  Status:             ' + activityResult.status);
    console.log('  From cache (1st):   ' + activityResult.fromCache);
    console.log('  From cache (2nd):   expected true');
    console.log('  Activities:         ' + activityCount);
    console.log('  LLM model:          ' + (aPlan.llm_model || 'unknown'));
    console.log('  Total time:         ' + formatDuration(activityDuration));
  } else {
    console.log('Activity Plan: FAILED');
    if (activityCallError) console.log('  Error: ' + activityCallError);
  }
  console.log();

  if (mealResult && !mealCallError) {
    const mPlan = mealResult.plan;
    const totalCals = mPlan ? (mPlan.total_calories || 0) : 0;
    const target = (mPlan && mPlan.calorie_target) || calorieTarget;
    const pct = target > 0 ? Math.round((totalCals / target) * 100) : 0;
    const totalItems = mPlan && Array.isArray(mPlan.meals)
      ? mPlan.meals.reduce((s, m) => s + (Array.isArray(m.items) ? m.items.length : 0), 0)
      : 'N/A';
    console.log('Meal Plan:');
    console.log('  Status:             ' + mealResult.status);
    console.log('  From cache (1st):   ' + mealResult.fromCache);
    console.log('  From cache (2nd):   expected true');
    console.log('  Meals:              ' + (mPlan && Array.isArray(mPlan.meals) ? mPlan.meals.length : 'N/A'));
    console.log('  Total items:        ' + totalItems);
    console.log('  Total calories:     ' + totalCals + ' kcal (' + pct + '% of ' + target + ' target)');
    console.log('  LLM model:          ' + (mPlan.llm_model || 'unknown'));
    console.log('  Total time:         ' + formatDuration(mealDuration));
  } else {
    console.log('Meal Plan: FAILED');
    if (mealCallError) console.log('  Error: ' + mealCallError);
  }
  console.log();

  console.log('============================================================');
  console.log('DIAGNOSTIC COMPLETE');
  console.log('============================================================');
}

// Run diagnostic — exit code 0 always (diagnostic, not pass/fail)
main().catch(err => {
  console.error('\n[FATAL] Unhandled error in diagnostic:');
  console.error('  ' + err.message);
  if (err.stack) {
    const stackLines = err.stack.split('\n').slice(0, 5);
    console.error('  Stack: ' + stackLines.join('\n  '));
  }
}).finally(() => {
  process.exit(0);
});
