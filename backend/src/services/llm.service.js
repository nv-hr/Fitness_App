import OpenAI from 'openai';
import NodeCache from 'node-cache';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError } from '../utils/errors.js';
import { levenshteinDistance } from '../utils/string.js';

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

const promptCache = new Map();

export function buildPrompt(filename, variables) {
  if (!promptCache.has(filename)) {
    const filePath = path.join(PROMPTS_DIR, filename);
    promptCache.set(filename, fs.readFileSync(filePath, 'utf-8'));
  }
  let template = promptCache.get(filename);
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    template = template.replace(placeholder, () => String(value ?? ''));
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

  return buildPrompt('weekly-plan-prompt.md', {
    weightKg: profile.weight_kg,
    heightCm: profile.height_cm,
    age: profile.age,
    gender: profile.gender,
    fitnessGoal: profile.fitness_goal,
    activityLevel: profile.activity_level || 'sedentary',
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
    if (!act.duration_min || act.duration_min < 10 || act.duration_min > 180) {
      errors.push(`${prefix}activity ${j + 1}: duration_min must be 10-180`);
    }
    if (!['light', 'moderate', 'vigorous'].includes(act.intensity)) {
      errors.push(`${prefix}activity ${j + 1}: intensity must be light/moderate/vigorous`);
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

  if (Array.isArray(plan.activities)) {
    return { valid: errors.length === 0, errors: validateActivities(plan.activities, '', false) };
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
        plan = await callLlmApi(prompt);
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
          plan = await callLlmApi(correctionPrompt);
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
          plan = await callLlmApi(correctionPrompt);
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

  // Update cache
  setCachedPlan(deps.userId, deps.weekStart, JSON.parse(JSON.stringify(mergedPlan)));

  return { plan: mergedPlan, day: mergedPlan.days[dayIndex], dayIndex, fromCache: false, status: 'active' };
}
