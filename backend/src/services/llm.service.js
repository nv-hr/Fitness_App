import OpenAI from 'openai';
import NodeCache from 'node-cache';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError, ValidationError } from '../utils/errors.js';

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
  model: process.env.LLM_MODEL || 'nvidia/nemotron-nano-30b-a3b',
  temperature: 0.2,
  maxTokens: 2000,
  retryDelayMs: 1000,
};

console.warn(`[LLM] Using model: ${CONFIG.model}. Verify this model is available on OpenRouter.`);

const planCache = new NodeCache({ stdTTL: 3600, checkperiod: 600, maxKeys: 1000 });

export function buildPrompt(filename, variables) {
  const filePath = path.join(PROMPTS_DIR, filename);
  let template = fs.readFileSync(filePath, 'utf-8');
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    template = template.replace(placeholder, String(value ?? ''));
  }
  return template;
}

export function buildSystemPrompt(profile, activityHistory, activities, weekStartDate) {
  const topActivityNames = [...new Set(activityHistory.map(a => a.activity_name))].slice(0, 5).join(', ');
  const historyText = activityHistory.length > 0
    ? activityHistory.map(a => {
        const dateStr = a.logged_date
          ? (typeof a.logged_date === 'string' ? a.logged_date : a.logged_date.toISOString().split('T')[0])
          : a.loggedDate;
        return `- ${dateStr}: ${a.activity_name} (${a.duration_min}min, ${a.intensity})`;
      }).join('\n')
    : 'No recent activity history.';
  const activitiesText = activities.map(a => `- ${a.name} (${a.estimated_calories} cal, ~${a.duration_min}min)`).join('\n');

  return buildPrompt('system-prompt.md', {
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
  });
}

export async function callLlmApi(systemPrompt) {
  const client = getClient();
  if (!client) {
    throw new AppError('LlmConfigError', 'OPENROUTER_API_KEY not configured', 503);
  }

  const response = await client.chat.completions.create({
    model: CONFIG.model,
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
  return JSON.parse(jsonMatch[0]);
}

export function validatePlanStructure(plan, weekStart) {
  const errors = [];

  if (!plan || !Array.isArray(plan.days)) {
    return { valid: false, errors: ['Plan must have a "days" array'] };
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

    if (!Array.isArray(day.activities)) {
      errors.push(`Day ${i + 1}: "activities" must be an array`);
      return;
    }

    if (day.activities.length < 1 || day.activities.length > 4) {
      errors.push(`Day ${i + 1}: expected 1-4 activities but got ${day.activities.length}`);
    }

    day.activities.forEach((act, j) => {
      if (!act.activity_id || typeof act.activity_id !== 'number' || act.activity_id < 1) {
        errors.push(`Day ${i + 1}, activity ${j + 1}: invalid activity_id`);
      }
      if (!act.name || typeof act.name !== 'string' || act.name.trim().length === 0) {
        errors.push(`Day ${i + 1}, activity ${j + 1}: name is required`);
      }
      if (!act.duration_min || act.duration_min < 10 || act.duration_min > 180) {
        errors.push(`Day ${i + 1}, activity ${j + 1}: duration_min must be 10-180`);
      }
      if (!['light', 'moderate', 'vigorous'].includes(act.intensity)) {
        errors.push(`Day ${i + 1}, activity ${j + 1}: intensity must be light/moderate/vigorous`);
      }
    });
  });

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

function levenshteinDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function validateAndFixPlan(plan, dbActivities) {
  let fixed = false;
  const errors = [];

  if (!plan || !Array.isArray(plan.days)) {
    return { valid: false, fixed: false, plan, errors: ['Plan has no days array'] };
  }

  for (const day of plan.days) {
    if (!Array.isArray(day.activities)) continue;

    for (const act of day.activities) {
      const result = fuzzyMatchActivityName(act.name, dbActivities);
      if (!result.matched) {
        errors.push(`Activity "${act.name}" not found in database`);
      } else if (result.matchType !== 'exact') {
        act.name = result.activity.name;
        act.activity_id = result.activity.id;
        fixed = true;
        console.warn(`[LLM] Fixed activity name: "${act.name}" → "${result.activity.name}"`);
      } else {
        act.activity_id = result.activity.id;
      }
    }
  }

  return { valid: errors.length === 0, fixed, plan, errors };
}

export function buildCorrectionPrompt(validationErrors) {
  return buildPrompt('correction-prompt.md', {
    validationErrors: validationErrors.join('\n'),
  });
}

export function getCachedPlan(userId, weekStart) {
  return planCache.get(`plan_${userId}_${weekStart}`);
}

export function setCachedPlan(userId, weekStart, plan) {
  planCache.set(`plan_${userId}_${weekStart}`, plan);
}

export function clearCachedPlan(userId, weekStart) {
  planCache.del(`plan_${userId}_${weekStart}`);
}

export async function generateFallbackPlan(deps) {
  const { getTopActivities, userId, weekStart } = deps;

  let topActivities;
  try {
    topActivities = await getTopActivities(userId, 5);
  } catch {
    topActivities = [];
  }

  if (topActivities.length === 0) {
    return {
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

    const activitiesPerDay = i < 5 ? Math.min(2, shuffled.length) : 1;
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
      activities: dayActivities,
    });
  }

  return {
    days,
    status: 'fallback',
    generated_at: new Date().toISOString(),
    llm_model: 'template-fallback',
  };
}

export async function generateWeeklyPlan(deps) {
  const { getProfile, getActivityHistory, getActivities, getTopActivities } = deps;

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
    const fallback = await generateFallbackPlan({ getTopActivities, userId: deps.userId, weekStart: deps.weekStart });
    return { plan: fallback, fromCache: false, status: fallback.status };
  }

  if (!profile) {
    const fallback = await generateFallbackPlan({ getTopActivities, userId: deps.userId, weekStart: deps.weekStart });
    return { plan: fallback, fromCache: false, status: fallback.status };
  }

  const prompt = buildSystemPrompt(profile, history, dbActivities, deps.weekStart);
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
          const fallback = await generateFallbackPlan({ getTopActivities, userId: deps.userId, weekStart: deps.weekStart });
          return { plan: fallback, fromCache: false, status: fallback.status };
        }
        await new Promise(r => setTimeout(r, CONFIG.retryDelayMs));
        continue;
      }
    }

    const structureCheck = validatePlanStructure(plan, deps.weekStart);
    if (!structureCheck.valid) {
      console.warn(`[LLM] Structural validation failed (attempt ${attempt}):`, structureCheck.errors.join('; '));
      if (attempt < maxAttempts) {
        const correctionPrompt = prompt + '\n\n' + buildCorrectionPrompt(structureCheck.errors);
        try {
          plan = await callLlmApi(correctionPrompt);
          // Correction succeeded — re-validate the corrected plan on next iteration
          skipInitialCall = true;
          continue;
        } catch {
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
        } catch {
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
  const fallback = await generateFallbackPlan({ getTopActivities, userId: deps.userId, weekStart: deps.weekStart });
  return { plan: fallback, fromCache: false, status: fallback.status };
}
