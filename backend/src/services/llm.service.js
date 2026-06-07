import OpenAI from 'openai';
import NodeCache from 'node-cache';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError, ValidationError, NotFoundError } from '../utils/errors.js';
import { levenshteinDistance } from '../utils/string.js';
import { calculateBmi, getBmiCategory, calculateBmr, calculateTdee, getCalorieTarget } from './profile.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.resolve(__dirname, '../../prompts');
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

const API_KEY = process.env.OPENROUTER_API_KEY;
if (!API_KEY) {
  console.error('FATAL: OPENROUTER_API_KEY is not set. LLM features will not work.');
  console.error('Set OPENROUTER_API_KEY in backend/.env or environment.');
}

let openaiClient = null;
function getClient() {
  if (!openaiClient && API_KEY) {
    openaiClient = new OpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey: API_KEY,
      timeout: 30000,
      maxRetries: 0,
      defaultHeaders: {
        'HTTP-Referer': APP_URL,
        'X-OpenRouter-Title': 'Fitness_App',
      },
    });
  }
  return openaiClient;
}

const CONFIG = {
  model: process.env.LLM_MODEL || 'openrouter/owl-alpha',
  fallbackModel: process.env.LLM_FALLBACK_MODEL || '',
  fallbackModel2: process.env.LLM_FALLBACK_MODEL_2 || '',
  temperature: 0.2,
  maxTokens: 2000,
  retryDelayMs: 1000,
};

console.log(`[LLM] Using model: ${CONFIG.model} (fallbacks: ${CONFIG.fallbackModel ? 'enabled' : 'none'}). Verify this model is available on OpenRouter.`);

const planCache = new NodeCache({ stdTTL: 3600, checkperiod: 600, maxKeys: 1000 });

// Per-user mutex for TOCTOU race prevention (CR-01)
// Serializes read-modify-write operations on the same cache key
const locks = new Map();

export async function acquireLock(key, timeout = 15000) {
  const start = Date.now();
  while (locks.get(key)) {
    if (Date.now() - start > timeout) throw new AppError('LockTimeout', 'Could not acquire lock', 429);
    await new Promise(r => setTimeout(r, 100));
  }
  locks.set(key, true);
  return () => locks.delete(key);
}

const promptCache = new Map();

export function buildPrompt(filename, variables) {
  if (!promptCache.has(filename)) {
    const filePath = path.join(PROMPTS_DIR, filename);
    promptCache.set(filename, fs.readFileSync(filePath, 'utf-8'));
  }
  let template = promptCache.get(filename);
  for (const [key, value] of Object.entries(variables)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const placeholder = new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g')
    const escaped = String(value ?? '').replace(/\{\{/g, '\\{\\{').replace(/\}\}/g, '\\}\\}')
    template = template.replace(placeholder, () => escaped)
  }
  return template;
}

export function buildSystemPrompt(profile, activityHistory, activities, weekStartDate, availableDays = null) {
  const historyEntries = activityHistory.slice(-20);
  const topActivityNames = [...new Set(activityHistory.map(a => a.activity_name))].slice(0, 5).join(', ');
  const historyText = historyEntries.length > 0
    ? historyEntries.map(a => {
        const dateStr = a.logged_date
          ? (typeof a.logged_date === 'string' ? a.logged_date : a.logged_date.toISOString().split('T')[0])
          : a.loggedDate;
        return `- ${dateStr}: ${a.activity_name} (${a.duration_min}min, ${a.intensity})`;
      }).join('\n')
    : 'No recent activity history.';
  const activitiesText = activities.map(a => `- ${a.name} (${a.estimated_calories} cal, ~${a.duration_min}min)`).join('\n');

  // Compute physiological variables
  const bmi = calculateBmi(profile.weight_kg, profile.height_cm);
  const bmiCategory = getBmiCategory(bmi);
  const bmr = Math.round(calculateBmr(profile.weight_kg, profile.height_cm, profile.age, profile.gender));
  const tdee = calculateTdee(profile.weight_kg, profile.height_cm, profile.age, profile.gender, profile.activity_level);
  const calorieTarget = tdee ? getCalorieTarget(tdee, profile.fitness_goal, profile.calorie_rate) : 2000;

  return buildPrompt('weekly-plan-prompt.md', {
    weightKg: profile.weight_kg,
    heightCm: profile.height_cm,
    age: profile.age,
    gender: profile.gender,
    fitnessGoal: profile.fitness_goal,
    activityLevel: profile.activity_level || 'sedentary',
    calorieTarget: String(calorieTarget || ''),
    bmr: String(bmr || ''),
    tdee: String(tdee || ''),
    bmi: String(bmi || ''),
    bmiCategory: bmiCategory || '',
    targetWeightKg: String(profile.target_weight_kg || ''),
    targetDate: String(profile.target_date || ''),
    activityHistory: historyText,
    topActivityNames,
    availableActivities: activitiesText,
    weekStartDate,
    availableDays: String(availableDays ?? ''),
  });
}

async function callLlmWithModel(client, model, systemPrompt) {
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Generate my weekly fitness plan based on my profile and history.' },
    ],
    temperature: CONFIG.temperature,
    max_tokens: CONFIG.maxTokens,
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new AppError('LlmEmptyResponse', 'LLM returned empty response', 502);
  }

  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new AppError('LlmParseError', 'No JSON object found in LLM response', 502);
  }
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    throw new AppError('LlmParseError', 'Failed to parse LLM response as JSON', 502);
  }
}

export async function callLlmApi(systemPrompt) {
  const client = getClient();
  if (!client) {
    throw new AppError('LlmConfigError', 'OPENROUTER_API_KEY not configured', 503);
  }

  const models = [
    { key: 'model', label: 'Primary' },
    { key: 'fallbackModel', label: 'Fallback' },
    { key: 'fallbackModel2', label: 'Secondary fallback' },
  ];

  for (const { key, label } of models) {
    const model = CONFIG[key];
    if (!model) continue;
    try {
      return await callLlmWithModel(client, model, systemPrompt);
    } catch (err) {
      console.warn(`[LLM] ${label} model ${model} failed: ${err.message}`);
    }
  }

  throw new AppError('LlmAllFailed', 'All LLM models failed', 502);
}

export async function callLlmStream(systemPrompt, onChunk, userPrompt = 'Generate my weekly fitness plan based on my profile and history.') {
  const client = getClient();
  if (!client) {
    throw new AppError('LlmConfigError', 'OPENROUTER_API_KEY not configured', 503);
  }

  const models = [
    { key: 'model', label: 'Primary' },
    { key: 'fallbackModel', label: 'Fallback' },
    { key: 'fallbackModel2', label: 'Secondary fallback' },
  ];

  for (const { key, label } of models) {
    const model = CONFIG[key];
    if (!model) continue;
    try {
      const responseStream = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: CONFIG.temperature,
        max_tokens: CONFIG.maxTokens,
        stream: true,
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          fullText += text;
          onChunk(text);
        }
      }
      return fullText;
    } catch (err) {
      console.warn(`[LLM Stream] ${label} model ${model} failed: ${err.message}`);
    }
  }

  throw new AppError('LlmAllFailed', 'All LLM models failed', 502);
}

export function validateActivities(activities, prefix, allowEmpty = false) {
  const errors = [];
  if (!Array.isArray(activities)) {
    errors.push(`${prefix}"activities" must be an array`);
    return errors;
  }
  if (!allowEmpty && activities.length < 1) {
    errors.push(`${prefix}expected 1-4 activities but got ${activities.length}`);
  } else if (activities.length > 4) {
    errors.push(`${prefix}expected 1-4 activities but got ${activities.length}`);
  }
  activities.forEach((act, j) => {
    if (!act.activity_id || typeof act.activity_id !== 'number' || act.activity_id < 1) {
      errors.push(`${prefix}activity ${j + 1}: invalid activity_id`);
    }
    if (!act.name || typeof act.name !== 'string' || act.name.trim().length === 0) {
      errors.push(`${prefix}activity ${j + 1}: name is required`);
    }
    if (!act.duration_min || act.duration_min < 5 || act.duration_min > 480) {
      errors.push(`${prefix}activity ${j + 1}: duration_min must be 5-480`);
    }
    if (!['light', 'moderate', 'vigorous'].includes(act.intensity)) {
      errors.push(`${prefix}activity ${j + 1}: intensity must be light/moderate/vigorous`);
    }
    if (act.calories_burned !== undefined && (typeof act.calories_burned !== 'number' || act.calories_burned < 0 || act.calories_burned > 3000)) {
      errors.push(`${prefix}activity ${j + 1}: calories_burned must be a positive number (max 3000)`);
    }
  });
  return errors;
}

export function validatePlanStructure(plan, weekStart, availableDays = null) {
  const errors = [];

  if (!plan) {
    return { valid: false, errors: ['Plan is null or undefined'] };
  }

  if (plan.format_version !== undefined && (typeof plan.format_version !== 'number' || !Number.isInteger(plan.format_version))) {
    errors.push('format_version must be an integer');
  }

  // Enforce format_version when availableDays is provided (new format path)
  // Legacy mode (availableDays === null) is backward-compatible without it.
  if (availableDays !== null && (plan.format_version === undefined || plan.format_version !== 1)) {
    errors.push('format_version must be 1 when using the weekly plan format');
  }

  if (Array.isArray(plan.activities)) {
    const actErrors = validateActivities(plan.activities, '', false)
    return { valid: errors.length === 0 && actErrors.length === 0, errors: [...errors, ...actErrors] }
  }

  if (!Array.isArray(plan.days)) {
    return { valid: false, errors: ['Plan must have an "activities" or "days" array'] };
  }

  if (plan.days.length !== 7) {
    errors.push(`Expected 7 days but got ${plan.days.length}`);
  }

  const startDate = new Date(weekStart + 'T00:00:00Z');
  const dayMs = 24 * 60 * 60 * 1000;

  plan.days.forEach((day, i) => {
    const expectedDate = new Date(startDate.getTime() + i * dayMs);
    const expectedStr = expectedDate.toISOString().split('T')[0];

    if (day.date !== expectedStr) {
      errors.push(`Day ${i + 1}: expected date ${expectedStr} but got ${day.date}`);
    }

    if (availableDays !== null) {
      // New rest_day-aware validation for weekly plans
      if (typeof day.rest_day !== 'boolean') {
        errors.push(`Day ${i + 1}: rest_day field is required and must be boolean`);
      } else if (day.rest_day === true) {
        // Rest day — must have empty activities array
        if (!Array.isArray(day.activities) || day.activities.length !== 0) {
          errors.push(`Day ${i + 1}: rest day must have empty activities array`);
        }
      } else {
        // Activity day — validate activities with allowEmpty=false (default)
        errors.push(...validateActivities(day.activities, `Day ${i + 1}, `));
      }
    } else {
      // Legacy validation (backward compatible)
      errors.push(...validateActivities(day.activities, `Day ${i + 1}, `));
    }
  });

  if (availableDays !== null) {
    const activityDayCount = plan.days.filter(d => d.rest_day === false).length;
    if (activityDayCount !== availableDays) {
      errors.push(`Expected ${availableDays} activity days (rest_day=false) but got ${activityDayCount}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Detect old-format weekly plans (pre-Phase 30) by checking for format_version.
 * Old format = plan exists but has no format_version at root level.
 * New format = format_version: 1 at root level.
 * @param {object|null|undefined} plan - Plan data object from DB or cache
 * @returns {boolean} true if plan exists and lacks format_version
 */
export function isOldFormat(plan) {
  return !!plan && plan.format_version === undefined;
}

export function fuzzyMatchActivityName(name, dbActivities) {
  if (!name || typeof name !== 'string') {
    return { matched: false, activity: null, matchType: 'none' };
  }
  const normalized = name.trim().toLowerCase();
  if (normalized.length === 0) {
    return { matched: false, activity: null, matchType: 'none' };
  }

  const exact = dbActivities.find(a => a.name.toLowerCase() === normalized);
  if (exact) {
    return { matched: true, activity: exact, matchType: 'exact' };
  }

  const contains = dbActivities.find(a => a.name.toLowerCase().includes(normalized) || normalized.includes(a.name.toLowerCase()));
  if (contains) {
    console.warn(`[LLM] Fuzzy match: "${name}" → "${contains.name}" (contains match)`);
    return { matched: true, activity: contains, matchType: 'fuzzy-contains' };
  }

  let bestMatch = null;
  let bestDistance = 4;
  for (const act of dbActivities) {
    const dist = levenshteinDistance(normalized, act.name.toLowerCase());
    if (dist < bestDistance) {
      bestDistance = dist;
      bestMatch = act;
    }
  }

  if (bestMatch) {
    console.warn(`[LLM] Fuzzy match: "${name}" → "${bestMatch.name}" (Levenshtein: ${bestDistance})`);
    return { matched: true, activity: bestMatch, matchType: 'fuzzy-levenshtein' };
  }

  return { matched: false, activity: null, matchType: 'none' };
}

export function validateAndFixPlan(plan, dbActivities) {
  const errors = [];

  if (!plan || !Array.isArray(plan.days)) {
    return { valid: false, plan, errors: ['Plan has no days array'] };
  }

  // Clone the plan to avoid mutating the caller's reference
  plan = JSON.parse(JSON.stringify(plan));

  for (const day of plan.days) {
    // Skip rest days — no activities to match
    if (day.rest_day === true) {
      if (!Array.isArray(day.activities)) {
        day.activities = []
      }
      continue
    }
    if (!Array.isArray(day.activities)) continue;

    for (const act of day.activities) {
      const result = fuzzyMatchActivityName(act.name, dbActivities);
      if (!result.matched) {
        errors.push(`Activity "${act.name}" not found in database`);
      } else if (result.matchType !== 'exact') {
        const originalName = act.name;
        act.name = result.activity.name;
        act.activity_id = result.activity.id;
        console.warn(`[LLM] Fixed activity name: "${originalName}" → "${result.activity.name}"`);
      } else {
        act.activity_id = result.activity.id;
      }
    }
  }

  return { valid: errors.length === 0, plan, errors };
}

export function buildCorrectionPrompt(validationErrors) {
  return buildPrompt('correction-prompt.md', {
    validationErrors: validationErrors.join('\n'),
  });
}

export function getCachedPlan(userId, weekStart, planType = 'activity') {
  return planCache.get(`plan_${planType}_${userId}_${weekStart}`);
}

export function setCachedPlan(userId, weekStart, plan, planType = 'activity') {
  planCache.set(`plan_${planType}_${userId}_${weekStart}`, plan);
}

export function clearCachedPlan(userId, weekStart, planType = 'activity') {
  planCache.del(`plan_${planType}_${userId}_${weekStart}`);
}

export async function generateFallbackPlan(deps) {
  const { getTopActivities, userId, weekStart, availableDays = 4 } = deps;

  let topActivities;
  try {
    topActivities = await getTopActivities(userId, 5);
  } catch {
    topActivities = [];
  }

  if (topActivities.length === 0) {
    return {
      format_version: 1,
      days: [],
      status: 'unavailable',
      generated_at: new Date().toISOString(),
      message: 'No activity history available to generate a fallback plan.',
    };
  }

  const startDate = new Date(weekStart + 'T00:00:00Z');
  const days = [];
  const shuffled = [...topActivities].sort(() => Math.random() - 0.5);

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    if (i < availableDays) {
      // Activity day
      const activitiesPerDay = Math.min(2, shuffled.length);
      const dayActivities = [];
      for (let j = 0; j < activitiesPerDay; j++) {
        const act = shuffled[(i + j) % shuffled.length];
        dayActivities.push({
          activity_id: act.id,
          name: act.name,
          duration_min: act.duration_min || 30,
          intensity: 'moderate',
        });
      }
      days.push({
        date: dateStr,
        rest_day: false,
        activities: dayActivities,
      });
    } else {
      // Rest day
      days.push({
        date: dateStr,
        rest_day: true,
        activities: [],
      });
    }
  }

  return {
    format_version: 1,
    days,
    status: 'fallback',
    generated_at: new Date().toISOString(),
    llm_model: 'template-fallback',
  };
}

export async function generateWeeklyPlan(deps) {
  const { getProfile, getActivityHistory, getActivities, getTopActivities, availableDays = 4 } = deps;

  const cached = getCachedPlan(deps.userId, deps.weekStart);
  if (cached) {
    return { plan: cached, fromCache: true, status: 'active' };
  }

  let profile, history, dbActivities;
  try {
    [profile, history, dbActivities] = await Promise.all([
      getProfile(deps.userId),
      getActivityHistory(deps.userId, 14),
      getActivities(),
    ]);
  } catch (err) {
    console.error('[LLM] Failed to fetch user data:', err.message);
    const fallback = await generateFallbackPlan({ getTopActivities, userId: deps.userId, weekStart: deps.weekStart, availableDays });
    return { plan: fallback, fromCache: false, status: fallback.status };
  }

  if (!profile) {
    const fallback = await generateFallbackPlan({ getTopActivities, userId: deps.userId, weekStart: deps.weekStart, availableDays });
    return { plan: fallback, fromCache: false, status: fallback.status };
  }

  const prompt = buildSystemPrompt(profile, history, dbActivities, deps.weekStart, availableDays);
  let plan;
  let attempt = 0;
  const maxAttempts = 2;
  let skipInitialCall = false;

  while (attempt < maxAttempts) {
    attempt++;
    if (skipInitialCall) {
      skipInitialCall = false;
    } else {
      try {
        if (deps.onChunk) {
          const rawText = await callLlmStream(prompt, deps.onChunk);
          const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new AppError('LlmParseError', 'No JSON object found in LLM response', 502);
          }
          plan = JSON.parse(jsonMatch[0]);
        } else {
          plan = await callLlmApi(prompt);
        }
      } catch (err) {
        console.error(`[LLM] API call attempt ${attempt} failed:`, err.message);
        if (attempt >= maxAttempts) {
          const fallback = await generateFallbackPlan({ getTopActivities, userId: deps.userId, weekStart: deps.weekStart, availableDays });
          return { plan: fallback, fromCache: false, status: fallback.status };
        }
        await new Promise(r => setTimeout(r, CONFIG.retryDelayMs));
        continue;
      }
    }

    const structureCheck = validatePlanStructure(plan, deps.weekStart, availableDays);
    if (!structureCheck.valid) {
      console.warn(`[LLM] Structural validation failed (attempt ${attempt}):`, structureCheck.errors.join('; '));
      if (attempt < maxAttempts) {
        const correctionPrompt = prompt + '\n\n' + buildCorrectionPrompt(structureCheck.errors);
        try {
          if (deps.onChunk) {
            deps.onChunk('\n\n[Correcting plan structure...]\n\n');
            const rawText = await callLlmStream(correctionPrompt, deps.onChunk);
            const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              throw new AppError('LlmParseError', 'No JSON object found in LLM response', 502);
            }
            plan = JSON.parse(jsonMatch[0]);
          } else {
            plan = await callLlmApi(correctionPrompt);
          }
          // Correction succeeded — re-validate the corrected plan on next iteration
          skipInitialCall = true;
          continue;
        } catch (correctionErr) {
          console.warn(`[LLM] Correction prompt attempt ${attempt} failed:`, correctionErr.message);
          if (attempt >= maxAttempts) break;
          await new Promise(r => setTimeout(r, CONFIG.retryDelayMs));
          continue;
        }
      }
      break;
    }

    const nameCheck = validateAndFixPlan(plan, dbActivities);
    if (!nameCheck.valid) {
      console.warn(`[LLM] Name validation failed (attempt ${attempt}):`, nameCheck.errors.join('; '));
      if (attempt < maxAttempts) {
        const correctionPrompt = prompt + '\n\n' + buildCorrectionPrompt(nameCheck.errors);
        try {
          if (deps.onChunk) {
            deps.onChunk('\n\n[Correcting activity names...]\n\n');
            const rawText = await callLlmStream(correctionPrompt, deps.onChunk);
            const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              throw new AppError('LlmParseError', 'No JSON object found in LLM response', 502);
            }
            plan = JSON.parse(jsonMatch[0]);
          } else {
            plan = await callLlmApi(correctionPrompt);
          }
          // Correction succeeded — re-validate the corrected plan on next iteration
          skipInitialCall = true;
          continue;
        } catch (correctionErr) {
          console.warn(`[LLM] Correction prompt attempt ${attempt} failed:`, correctionErr.message);
          if (attempt >= maxAttempts) break;
          await new Promise(r => setTimeout(r, CONFIG.retryDelayMs));
          continue;
        }
      }
      break;
    }

    plan = nameCheck.plan;

    setCachedPlan(deps.userId, deps.weekStart, JSON.parse(JSON.stringify(plan)));

    return { plan, fromCache: false, status: 'active' };
  }

  console.warn('[LLM] All generation attempts failed, returning fallback');
  const fallback = await generateFallbackPlan({ getTopActivities, userId: deps.userId, weekStart: deps.weekStart, availableDays });
  return { plan: fallback, fromCache: false, status: fallback.status };
}

export async function regenerateDay(deps, dayIndex) {
  // Validate dayIndex
  if (typeof dayIndex !== 'number' || dayIndex < 0 || dayIndex > 6) {
    throw new AppError('ValidationError', 'dayIndex must be a number between 0 and 6', 400);
  }

  // Acquire per-user lock to prevent TOCTOU race on the cache (CR-01)
  const lockKey = `swap_${deps.userId}_${deps.weekStart}`
  const release = await acquireLock(lockKey)
  try {
    // Defensively propagate availableDays from the cached plan
    // if the caller did not explicitly provide it. This prevents
    // silently switching availableDays when regenerating a single day.
    if (!deps.availableDays) {
      const cached = getCachedPlan(deps.userId, deps.weekStart)
      if (cached && Array.isArray(cached.days)) {
        const activityDays = cached.days.filter(d => d.rest_day === false).length
        if (activityDays > 0) deps.availableDays = activityDays
      }
    }

    // Clear cache so generateWeeklyPlan actually makes an LLM call (not returning stale cache)
    clearCachedPlan(deps.userId, deps.weekStart);
    // Generate a fresh full week plan (this consumes the rate-limit quota)
    const result = await generateWeeklyPlan(deps);
    const freshPlan = result.plan;

    if (!freshPlan || !freshPlan.days || !freshPlan.days[dayIndex]) {
      throw new AppError('GenerationError', 'Failed to generate plan for the requested day', 500);
    }

    // Get existing plan from cache or use fresh plan
    const cached = getCachedPlan(deps.userId, deps.weekStart);
    const existingPlan = cached || freshPlan;

    // Replace only the requested day
    const mergedPlan = JSON.parse(JSON.stringify(existingPlan));
    mergedPlan.days[dayIndex] = freshPlan.days[dayIndex];
    mergedPlan.status = 'active';
    mergedPlan.generated_at = new Date().toISOString();

    // Update cache (under lock — prevents TOCTOU race)
    setCachedPlan(deps.userId, deps.weekStart, JSON.parse(JSON.stringify(mergedPlan)));

    return { plan: mergedPlan, day: mergedPlan.days[dayIndex], dayIndex, fromCache: false, status: 'active' };
  } finally {
    release()
  }
}

/**
 * Fallback to a random activity from the database when the LLM swap fails.
 * @param {object} deps - Data-fetching callbacks and context (must have getRandomActivity)
 * @param {string[]} goalTags - Fitness goal tags for random activity filtering
 * @returns {Promise<object>} Replacement activity object
 * @throws {AppError} If no fallback is available
 */
async function getFallbackReplacement(deps, goalTags) {
  if (typeof deps.getRandomActivity !== 'function') {
    throw new AppError('SwapFallbackError', 'No fallback activity available', 500);
  }
  try {
    const randomActs = await deps.getRandomActivity(goalTags);
    if (!randomActs || randomActs.length === 0) {
      throw new AppError('SwapFallbackError', 'No fallback activity available', 500);
    }
    return {
      activity_id: randomActs[0].id,
      name: randomActs[0].name,
      duration_min: randomActs[0].duration_min || 30,
      intensity: 'moderate',
      logged: false,
      calories_burned: randomActs[0].estimated_calories || 100,
    };
  } catch (fallbackErr) {
    throw new AppError('SwapFallbackError', 'No fallback activity available', 500);
  }
}

/**
 * Swap a single activity in the cached weekly plan with an LLM-generated replacement.
 *
 * @param {object} deps - Data-fetching callbacks and context.
 * @param {Function} deps.getProfile - (userId) => profile object or null
 * @param {Function} deps.getActivityHistory - (userId, days) => array of activity log entries
 * @param {Function} deps.getActivities - () => array of all db activities
 * @param {Function} deps.getTopActivities - (userId, limit) => array of top activities
 * @param {Function} deps.getRandomActivity - (goalTags) => array of random activities
 * @param {number|string} deps.userId - User identifier
 * @param {string} deps.weekStart - ISO date string (YYYY-MM-DD) for the week start
 * @param {number} [deps.availableDays] - Optional count of activity days (inferred from plan if absent)
 * @param {number} activityId - The database activity_id to replace
 * @param {number} dayIndex - The plan day index (0-6) containing the activity
 * @returns {Promise<{plan: object, day: object, dayIndex: number, activityIndex: number, replacement: object, fromCache: boolean, status: string}>}
 * @throws {AppError} If plan not found, activity not in plan, or validation failure
 */
export async function swapActivity(deps, activityId, dayIndex, skipLock = false) {
  // 1. Validate inputs
  if (typeof activityId !== 'number' || !Number.isInteger(activityId) || activityId < 1) {
    throw new AppError('ValidationError', 'activityId must be a positive integer', 400)
  }

  if (typeof dayIndex !== 'number' || dayIndex < 0 || dayIndex > 6) {
    throw new AppError('ValidationError', 'dayIndex must be a number between 0 and 6', 400)
  }

  // Acquire per-user lock to prevent TOCTOU race on the cache (CR-01)
  // CR-02: When skipLock is true, the caller (e.g., swapHandler with lifted lock scope)
  // already holds the lock — skip acquisition to avoid deadlock.
  const lockKey = `swap_${deps.userId}_${deps.weekStart}`
  const release = skipLock ? null : await acquireLock(lockKey)
  try {
    // 2. Get current plan from cache
    const plan = getCachedPlan(deps.userId, deps.weekStart)
    if (!plan || !Array.isArray(plan.days)) {
      throw new AppError('NotFoundError', 'No weekly plan found for this week', 404)
    }

    if (!plan.days[dayIndex]) {
      throw new AppError('ValidationError', 'Invalid day index in plan', 400)
    }

    // 3. Locate the activity within the plan day
    const day = plan.days[dayIndex]
    if (day.rest_day === true) {
      throw new AppError('ValidationError', 'Cannot swap an activity on a rest day', 400)
    }

    const activityIndex = day.activities.findIndex(a => a.activity_id === activityId)
    if (activityIndex === -1) {
      throw new NotFoundError('Activity not found in current plan')
    }

    // 4. Fetch user data
    let profile, dbActivities
    try {
      [profile, dbActivities] = await Promise.all([
        deps.getProfile(deps.userId),
        deps.getActivities(),
      ])
    } catch (err) {
      console.error('[LLM] Failed to fetch user data for swap:', err.message)
      profile = null
      dbActivities = []
    }

    // 5. Build context strings
    const act = day.activities[activityIndex]
    const swappedActivity = `${act.name} (${act.duration_min} min, ${act.intensity}, ${act.calories_burned || '?'} cal)`
    const dayContext = `Day ${dayIndex + 1} (${day.date})`

    const activityDayCount = plan.days.filter(d => d.rest_day === false).length
    const restDayCount = plan.days.filter(d => d.rest_day === true).length
    const weekContext = `${activityDayCount} activity days, ${restDayCount} rest days`

    const activitiesText = Array.isArray(dbActivities)
      ? dbActivities.map(a => `- ${a.name} (${a.estimated_calories} cal, ~${a.duration_min}min)`).join('\n')
      : ''

    // Determine fitness goal and activity level for template variables
    const fitnessGoal = profile?.fitness_goal || 'maintain'
    const activityLevel = profile?.activity_level || 'sedentary'

    // 6. Build swap prompt
    const prompt = buildPrompt('activity-swap-prompt.md', {
      fitnessGoal,
      activityLevel,
      swappedActivity,
      dayContext,
      weekContext,
      availableActivities: activitiesText,
    })

    // Goal tags for fallback random activity selection
    const goalTagsMap = {
      'lose weight': ['lose_weight'],
      'build muscle': ['gain_weight'],
      'maintain': ['maintain'],
    }
    const goalTags = goalTagsMap[fitnessGoal] || ['maintain']

    // 7. Call LLM with fallback
    let replacement
    try {
      if (deps.onChunk) {
        const rawText = await callLlmStream(prompt, deps.onChunk, 'Swap a fitness activity');
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new AppError('LlmParseError', 'No JSON object found in LLM response', 502);
        }
        replacement = JSON.parse(jsonMatch[0]);
      } else {
        replacement = await callLlmApi(prompt)
      }
    } catch (err) {
      console.warn(`[LLM] Swap LLM call failed: ${err.message}, falling back to random activity`)
      replacement = null
    }

    // 8. Validate replacement; fallback to random on failure
    const isInvalidReplacement =
      !replacement ||
      !replacement.activity_id ||
      typeof replacement.activity_id !== 'number' ||
      !replacement.name

    if (isInvalidReplacement) {
      replacement = await getFallbackReplacement(deps, goalTags)
    } else {
      // Validate structure via validateActivities
      const validationErrors = validateActivities([replacement], 'Swap, ')
      if (validationErrors.length > 0) {
        console.warn(`[LLM] Swap replacement validation failed: ${validationErrors.join('; ')}, falling back to random`)
        replacement = await getFallbackReplacement(deps, goalTags)
      }
    }

    // 9. Fuzzy-match the replacement's activity name to a real DB activity
    if (Array.isArray(dbActivities) && dbActivities.length > 0 && replacement.name) {
      const matchResult = fuzzyMatchActivityName(replacement.name, dbActivities)
      if (matchResult.matched) {
        replacement.activity_id = matchResult.activity.id
        replacement.name = matchResult.activity.name
      } else {
        console.warn(`[LLM] Swap replacement "${replacement.name}" not found in DB, using as-is`)
      }
    }

    // 10. Deep-clone plan and replace the activity in-place
    const mergedPlan = JSON.parse(JSON.stringify(plan))
    mergedPlan.days[dayIndex].activities[activityIndex] = JSON.parse(JSON.stringify(replacement))
    mergedPlan.status = 'active'
    mergedPlan.generated_at = new Date().toISOString()

    // Ensure format_version is present
    if (mergedPlan.format_version === undefined) {
      mergedPlan.format_version = 1
    }

    // 11. Update cache (under lock — prevents TOCTOU race with concurrent swaps)
    setCachedPlan(deps.userId, deps.weekStart, JSON.parse(JSON.stringify(mergedPlan)))

    // 12. Return result
    return {
      plan: mergedPlan,
      day: mergedPlan.days[dayIndex],
      dayIndex,
      activityIndex,
      replacement,
      fromCache: false,
      status: 'active',
    }
  } finally {
    // CR-02: Only release if we acquired the lock ourselves
    if (release) release()
  }
}
