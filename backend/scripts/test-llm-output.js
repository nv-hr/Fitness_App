#!/usr/bin/env node
/**
 * LLM DIAGNOSTIC — Full Prompt & Response Analysis
 *
 * Tests both the Activity Plan (weekly) and Meal Plan (daily) LLM flows
 * using realistic sample data (no database required).
 *
 * Usage:
 *   node backend/scripts/test-llm-output.js
 *
 * Exit code: 0 always (diagnostic, not pass/fail)
 */

import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Module-level setup ───────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── Model configuration (mirrored from llm.service.js for clarity) ────────────
const MODEL_CONFIG = {
  model: process.env.LLM_MODEL || 'openrouter/owl-alpha',
  fallbackModel: process.env.LLM_FALLBACK_MODEL || '',
  fallbackModel2: process.env.LLM_FALLBACK_MODEL_2 || '',
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  temperature: 0.2,
  maxTokens: 2000,
};

// ── Dynamic imports (after dotenv so env vars are available) ──────────────────
let buildSystemPrompt, buildPrompt, validatePlanStructure, validateAndFixPlan;
let fuzzyMatchActivityName;
let validateDailyMealPlanStructure, validateAndFixDailyMealPlan;
let fuzzyMatchFoodName;

try {
  const llmModule = await import('../src/services/llm.service.js');
  buildSystemPrompt = llmModule.buildSystemPrompt;
  buildPrompt = llmModule.buildPrompt;
  validatePlanStructure = llmModule.validatePlanStructure;
  validateAndFixPlan = llmModule.validateAndFixPlan;
  fuzzyMatchActivityName = llmModule.fuzzyMatchActivityName;

  const mealPlanModule = await import('../src/services/dailyMealPlan.service.js');
  validateDailyMealPlanStructure = mealPlanModule.validateDailyMealPlanStructure;
  validateAndFixDailyMealPlan = mealPlanModule.validateAndFixDailyMealPlan;

  const foodUtils = await import('../src/utils/food.js');
  fuzzyMatchFoodName = foodUtils.fuzzyMatchFoodName;
} catch (importErr) {
  console.error('FATAL: Failed to import service modules:', importErr.message);
  process.exit(0);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Create a fresh OpenAI client (mirrors getClient from llm.service.js) */
function createClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    baseURL: MODEL_CONFIG.baseURL,
    apiKey,
    timeout: 30000,
    maxRetries: 0,
    defaultHeaders: {
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3001',
      'X-OpenRouter-Title': 'Fitness_App',
    },
  });
}

/**
 * Call the LLM and return both the raw response text and the parsed JSON.
 * Handles errors gracefully — never throws.
 */
async function callLlmAndCaptureRaw(systemPrompt) {
  const result = {
    success: false,
    modelUsed: null,
    rawContent: null,
    parsed: null,
    error: null,
    promptSize: systemPrompt.length,
    responseSize: 0,
  };

  const client = createClient();
  if (!client) {
    result.error = 'OPENROUTER_API_KEY not configured';
    return result;
  }

  const models = [
    { key: 'model', label: 'Primary' },
    { key: 'fallbackModel', label: 'Fallback' },
    { key: 'fallbackModel2', label: 'Secondary fallback' },
  ];

  for (const { key, label } of models) {
    const model = MODEL_CONFIG[key];
    if (!model) continue;

    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate my weekly fitness plan based on my profile and history.' },
        ],
        temperature: MODEL_CONFIG.temperature,
        max_tokens: MODEL_CONFIG.maxTokens,
      });

      result.modelUsed = response.model || model;
      const message = response.choices?.[0]?.message;
      let rawContent = message?.content || '';

      // Handle reasoning models that put output in the `reasoning` field
      if (!rawContent && message?.reasoning) {
        rawContent = message.reasoning;
      }
      if (!rawContent && message?.reasoning_details?.length) {
        rawContent = message.reasoning_details.map(d => d.text).join('\n');
      }

      result.rawContent = rawContent;
      result.responseSize = rawContent.length;
      result.success = true;

      // Try to parse JSON from the raw content
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result.parsed = JSON.parse(jsonMatch[0]);
        } catch (parseErr) {
          result.error = `JSON parse error: ${parseErr.message}`;
        }
      } else {
        result.error = 'No JSON object found in response';
      }

      return result;
    } catch (err) {
      console.warn(`\n  [${label}] Model "${model}" failed: ${err.message}`);
      if (err.status) console.warn(`  Status: ${err.status}`);
      result.error = `${label} model failed: ${err.message}`;
    }
  }

  return result;
}

/** Compute Monday of the current week as YYYY-MM-DD */
function getMondayOfCurrentWeek() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

/** Format date as YYYY-MM-DD */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/** Generate 14 days of sample activity history */
function generateSampleActivityHistory() {
  const activities = [
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
    const entry = activities[i % activities.length];
    history.push({
      logged_date: formatDate(date),
      activity_name: entry.name,
      duration_min: entry.duration,
      intensity: entry.intensity,
    });
  }
  return history;
}

/** Generate sample available activities (10+ items) */
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

/** Generate sample food database (15+ realistic items) */
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

/** Generate sample recent food logs (5 days) */
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

// ── Main diagnostic ────────────────────────────────────────────────────────────

async function main() {
  console.log('============================================================');
  console.log('LLM DIAGNOSTIC — Full Prompt & Response Analysis');
  console.log('============================================================');
  console.log();

  // ── Section 1: Config ─────────────────────────────────────────────────────
  console.log('============================================================');
  console.log('1. CONFIG');
  console.log('============================================================');
  console.log(`  Model:                    ${MODEL_CONFIG.model}`);
  console.log(`  Fallback model:           ${MODEL_CONFIG.fallbackModel || '(none)'}`);
  console.log(`  Fallback 2:               ${MODEL_CONFIG.fallbackModel2 || '(none)'}`);
  console.log(`  Base URL:                 ${MODEL_CONFIG.baseURL}`);
  console.log(`  Temperature:              ${MODEL_CONFIG.temperature}`);
  console.log(`  Max tokens:               ${MODEL_CONFIG.maxTokens}`);
  console.log(`  API key set:              ${process.env.OPENROUTER_API_KEY ? 'YES' : 'NO'}`);
  console.log(`  API key prefix:           ${process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.substring(0, 8) + '...' : 'N/A'}`);
  console.log();

  // ── Sample data for Activity Plan ──────────────────────────────────────────
  const weekStart = getMondayOfCurrentWeek();
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

  // ── Section 2: Activity Plan — Rendered Prompt ────────────────────────────
  console.log('============================================================');
  console.log('2. ACTIVITY PLAN — Rendered Prompt');
  console.log('============================================================');
  console.log();

  let activityPrompt = '(error building prompt)';
  try {
    activityPrompt = buildSystemPrompt(sampleProfile, sampleActivityHistory, sampleActivities, weekStart);
  } catch (err) {
    console.error(`[ERROR] Failed to build activity plan prompt: ${err.message}`);
  }

  console.log('===== ACTIVITY PLAN SYSTEM PROMPT (RENDERED) =====');
  console.log(activityPrompt);
  console.log('===== END RENDERED PROMPT =====');
  console.log();

  // ── Section 3: Activity Plan — API Response ───────────────────────────────
  console.log('============================================================');
  console.log('3. ACTIVITY PLAN — API Response (raw)');
  console.log('============================================================');
  console.log();

  const activityResult = await callLlmAndCaptureRaw(activityPrompt);
  console.log('===== ACTIVITY PLAN RAW RESPONSE =====');
  if (activityResult.success) {
    console.log(activityResult.rawContent);
  } else {
    console.log(`[LLM API ERROR] ${activityResult.error}`);
  }
  console.log('===== END RAW RESPONSE =====');
  console.log();

  // ── Section 4: Activity Plan — Validation Results ─────────────────────────
  console.log('============================================================');
  console.log('4. ACTIVITY PLAN — Validation Results');
  console.log('============================================================');
  console.log();

  let activityValidation = null;
  if (activityResult.success && activityResult.parsed) {
    activityValidation = validatePlanStructure(activityResult.parsed, weekStart);
    console.log(`Result: ${activityValidation.valid ? 'VALID' : 'INVALID'}`);
    if (activityValidation.errors.length > 0) {
      console.log('Errors found:');
      activityValidation.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    } else {
      console.log('No errors — structure is valid.');
    }
  } else {
    console.log('Result: SKIPPED — no valid parsed response to validate');
    if (activityResult.error) {
      console.log(`Reason: ${activityResult.error}`);
    }
  }
  console.log();

  // ── Section 5: Activity Plan — Name Fixing Results ────────────────────────
  console.log('============================================================');
  console.log('5. ACTIVITY PLAN — Name Fixing Results');
  console.log('============================================================');
  console.log();

  if (activityResult.success && activityResult.parsed) {
    if (activityValidation && activityValidation.valid) {
      const nameFixResult = validateAndFixPlan(activityResult.parsed, sampleActivities);
      console.log(`Result: ${nameFixResult.valid ? 'VALID' : 'INVALID'}`);
      if (nameFixResult.errors.length > 0) {
        console.log('Errors:');
        nameFixResult.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
      } else {
        console.log('All activity names matched successfully.');
      }

      // Show individual fuzzy match details
      console.log();
      console.log('Individual activity matching:');
      if (nameFixResult.plan && nameFixResult.plan.days) {
        let fuzzyCount = 0;
        for (const day of nameFixResult.plan.days) {
          if (!Array.isArray(day.activities)) continue;
          for (const act of day.activities) {
            const match = fuzzyMatchActivityName(act.name, sampleActivities);
            const tag = match.matchType === 'exact' ? '✓' : match.matched ? '↻' : '✗';
            console.log(`  ${tag} "${act.name}" → matchType: ${match.matchType}${match.matched ? ` (id: ${match.activity.id})` : ''}`);
            if (match.matched && match.matchType !== 'exact') fuzzyCount++;
          }
        }
        console.log(`\n  Fuzzy matches applied: ${fuzzyCount}`);
      }
    } else {
      console.log('Result: SKIPPED — validation did not pass');
      if (activityValidation) {
        console.log(`Errors preventing name fixing: ${activityValidation.errors.length}`);
      }
    }
  } else {
    console.log('Result: SKIPPED — no valid response to fix');
  }
  console.log();

  // ── Sample data for Meal Plan ─────────────────────────────────────────────
  const sampleFoods = generateSampleFoods();
  const sampleFoodLogs = generateSampleFoodLogs();
  const planDate = formatDate(new Date());
  const calorieTarget = 2000;

  // Build the meal plan prompt inline (buildDailyMealPlanPrompt is private)
  function buildMealPlanPromptInline(profile, dbFoods, recentLogs, _planDate, target) {
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
      calorieTarget: String(target),
      weightKg: String(profile.weight_kg || profile.weightKg || ''),
      heightCm: String(profile.height_cm || profile.heightCm || ''),
      age: String(profile.age || ''),
      gender: profile.gender || '',
      fitnessGoal: profile.fitness_goal || profile.fitnessGoal || '',
      recentFoodLogs: recentText,
    });
  }

  // ── Section 6: Meal Plan — Rendered Prompt ────────────────────────────────
  console.log('============================================================');
  console.log('6. MEAL PLAN — Rendered Prompt');
  console.log('============================================================');
  console.log();

  let mealPrompt = '(error building prompt)';
  try {
    mealPrompt = buildMealPlanPromptInline(sampleProfile, sampleFoods, sampleFoodLogs, planDate, calorieTarget);
  } catch (err) {
    console.error(`[ERROR] Failed to build meal plan prompt: ${err.message}`);
  }

  console.log('===== MEAL PLAN SYSTEM PROMPT (RENDERED) =====');
  console.log(mealPrompt);
  console.log('===== END RENDERED PROMPT =====');
  console.log();

  // ── Section 7: Meal Plan — API Response ───────────────────────────────────
  console.log('============================================================');
  console.log('7. MEAL PLAN — API Response (raw)');
  console.log('============================================================');
  console.log();

  const mealResult = await callLlmAndCaptureRaw(mealPrompt);
  console.log('===== MEAL PLAN RAW RESPONSE =====');
  if (mealResult.success) {
    console.log(mealResult.rawContent);
  } else {
    console.log(`[LLM API ERROR] ${mealResult.error}`);
  }
  console.log('===== END RAW RESPONSE =====');
  console.log();

  // ── Section 8: Meal Plan — Validation Results ─────────────────────────────
  console.log('============================================================');
  console.log('8. MEAL PLAN — Validation Results');
  console.log('============================================================');
  console.log();

  let mealValidation = null;
  if (mealResult.success && mealResult.parsed) {
    mealValidation = validateDailyMealPlanStructure(mealResult.parsed);
    console.log(`Result: ${mealValidation.valid ? 'VALID' : 'INVALID'}`);
    if (mealValidation.errors.length > 0) {
      console.log('Errors found:');
      mealValidation.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    } else {
      console.log('No errors — structure is valid.');
    }
  } else {
    console.log('Result: SKIPPED — no valid parsed response to validate');
    if (mealResult.error) {
      console.log(`Reason: ${mealResult.error}`);
    }
  }
  console.log();

  // ── Section 9: Meal Plan — Name Fixing Results ────────────────────────────
  console.log('============================================================');
  console.log('9. MEAL PLAN — Name Fixing Results');
  console.log('============================================================');
  console.log();

  if (mealResult.success && mealResult.parsed) {
    if (mealValidation && mealValidation.valid) {
      const nameFixResult = validateAndFixDailyMealPlan(mealResult.parsed, sampleFoods);
      console.log(`Result: ${nameFixResult.valid ? 'VALID' : 'INVALID'}`);
      if (nameFixResult.errors.length > 0) {
        console.log('Errors:');
        nameFixResult.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
      } else {
        console.log('All food names matched successfully.');
      }
      if (nameFixResult.warnings && nameFixResult.warnings.length > 0) {
        console.log('Warnings:');
        nameFixResult.warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
      }

      // Show individual food name matching
      console.log();
      console.log('Individual food item matching:');
      if (nameFixResult.plan && nameFixResult.plan.meals) {
        let fuzzyCount = 0;
        for (const meal of nameFixResult.plan.meals) {
          if (!Array.isArray(meal.items)) continue;
          for (const item of meal.items) {
            const match = fuzzyMatchFoodName(item.food_name, sampleFoods);
            const tag = match.matchType === 'exact' ? '✓' : match.matched ? '↻' : '✗';
            console.log(`  ${tag} "${item.food_name}" → matchType: ${match.matchType}${match.matched ? ` (id: ${match.food.id})` : ''}`);
            if (match.matched && match.matchType !== 'exact') fuzzyCount++;
          }
        }
        console.log(`\n  Fuzzy matches applied: ${fuzzyCount}`);
      }
    } else {
      console.log('Result: SKIPPED — validation did not pass');
      if (mealValidation) {
        console.log(`Errors preventing name fixing: ${mealValidation.errors.length}`);
      }
    }
  } else {
    console.log('Result: SKIPPED — no valid response to fix');
  }
  console.log();

  // ── Section 10: Summary ────────────────────────────────────────────────────
  console.log('============================================================');
  console.log('SUMMARY');
  console.log('============================================================');
  console.log();

  console.log('Activity Plan:');
  console.log(`  Model used:       ${activityResult.modelUsed || 'N/A'}`);
  console.log(`  Prompt size:      ${activityResult.promptSize} characters`);
  console.log(`  Response size:    ${activityResult.responseSize} characters`);
  console.log(`  API success:      ${activityResult.success ? 'YES' : 'NO'}`);
  console.log(`  Parsed JSON:      ${activityResult.parsed ? 'YES' : 'NO'}`);
  console.log(`  Validation:       ${activityValidation ? (activityValidation.valid ? 'PASS' : 'FAIL') : 'SKIPPED'}`);
  console.log(`  Validation errs:  ${activityValidation ? activityValidation.errors.length : 'N/A'}`);
  if (activityResult.error) {
    console.log(`  Error:            ${activityResult.error}`);
  }
  console.log();

  console.log('Meal Plan:');
  console.log(`  Model used:       ${mealResult.modelUsed || 'N/A'}`);
  console.log(`  Prompt size:      ${mealResult.promptSize} characters`);
  console.log(`  Response size:    ${mealResult.responseSize} characters`);
  console.log(`  API success:      ${mealResult.success ? 'YES' : 'NO'}`);
  console.log(`  Parsed JSON:      ${mealResult.parsed ? 'YES' : 'NO'}`);
  console.log(`  Validation:       ${mealValidation ? (mealValidation.valid ? 'PASS' : 'FAIL') : 'SKIPPED'}`);
  console.log(`  Validation errs:  ${mealValidation ? mealValidation.errors.length : 'N/A'}`);
  if (mealResult.error) {
    console.log(`  Error:            ${mealResult.error}`);
  }
  console.log();

  console.log('============================================================');
  console.log('DIAGNOSTIC COMPLETE');
  console.log('============================================================');
}

// Run the diagnostic, always exit 0
main().catch(err => {
  console.error('\n[FATAL] Unhandled error in diagnostic:');
  console.error(`  ${err.message}`);
  console.error(`  Stack: ${err.stack}`);
}).finally(() => {
  process.exit(0);
});
