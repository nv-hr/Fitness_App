import { buildPrompt, callLlmApi, getCachedPlan, setCachedPlan } from './llm.service.js';
import { findByUserAndDate, upsertPlan } from '../repositories/activityPlan.repository.js';
import { AppError } from '../utils/errors.js';

export function validateActivityPlanStructure(plan, planDate) {
  const errors = [];
  if (!plan || !Array.isArray(plan.activities)) {
    return { valid: false, errors: ['Plan must have an "activities" array'] };
  }
  if (plan.date && plan.date !== planDate) {
    errors.push(`Expected date ${planDate} but got ${plan.date}`);
  }
  if (plan.activities.length < 1 || plan.activities.length > 4) {
    errors.push(`Expected 1-4 activities but got ${plan.activities.length}`);
  }
  const validIntensities = ['light', 'moderate', 'vigorous'];
  plan.activities.forEach((act, i) => {
    if (!act.activity_id || typeof act.activity_id !== 'number' || act.activity_id < 1) {
      errors.push(`Activity ${i + 1}: invalid activity_id`);
    }
    if (!act.name || typeof act.name !== 'string' || act.name.trim().length === 0) {
      errors.push(`Activity ${i + 1}: name is required`);
    }
    if (!act.duration_min || act.duration_min < 10 || act.duration_min > 180) {
      errors.push(`Activity ${i + 1}: duration_min must be 10-180`);
    }
    if (!validIntensities.includes(act.intensity)) {
      errors.push(`Activity ${i + 1}: intensity must be light/moderate/vigorous`);
    }
  });
  return { valid: errors.length === 0, errors };
}

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateFallbackActivityPlan(dbActivities) {
  if (!dbActivities || dbActivities.length === 0) {
    return {
      activities: [
        { activity_id: 0, name: 'Walking', duration_min: 30, intensity: 'light', logged: false },
      ],
      generated_at: new Date().toISOString(),
      llm_model: 'template-fallback',
    };
  }
  const count = Math.min(3, dbActivities.length);
  const selected = pickRandom(dbActivities, count);
  const activities = selected.map(a => ({
    activity_id: a.id,
    name: a.name,
    duration_min: Math.max(10, Math.min(60, Math.round((a.estimated_calories || 200) / 10) * 5)),
    intensity: a.duration_min >= 60 ? 'vigorous' : a.duration_min >= 30 ? 'moderate' : 'light',
    logged: false,
  }));
  return {
    activities,
    generated_at: new Date().toISOString(),
    llm_model: 'template-fallback',
  };
}

function buildActivityPlanPrompt(profile, dbActivities, activityHistory, planDate) {
  const activitiesText = dbActivities.map(a =>
    `- ID ${a.id}: ${a.name} (${a.estimated_calories} cal, ~${a.duration_min}min)`
  ).join('\n');
  const historyText = activityHistory && activityHistory.length > 0
    ? activityHistory.slice(-10).map(a =>
        `- ${a.log_date || a.loggedDate || ''}: ${a.activity_name} (${a.duration_min}min, ${a.intensity})`
      ).join('\n')
    : 'No recent activity history.';
  return buildPrompt('system-prompt.md', {
    weightKg: String(profile.weight_kg || profile.weightKg || ''),
    heightCm: String(profile.height_cm || profile.heightCm || ''),
    age: String(profile.age || ''),
    gender: profile.gender || '',
    fitnessGoal: profile.fitness_goal || profile.fitnessGoal || '',
    activityLevel: profile.activity_level || 'sedentary',
    activityHistory: historyText,
    topActivityNames: '',
    availableActivities: activitiesText,
    weekStartDate: planDate,
  });
}

export async function generateActivityPlan(deps) {
  const { userId, planDate, getProfile, getAllActivities, getActivityHistory } = deps;
  const cached = getCachedPlan(userId, planDate, 'activity');
  if (cached) {
    return { plan: cached, fromCache: true, status: 'active' };
  }
  let profile, dbActivities, recentHistory;
  try {
    [profile, dbActivities, recentHistory] = await Promise.all([
      getProfile(userId),
      getAllActivities(userId),
      getActivityHistory(userId, 14),
    ]);
  } catch (err) {
    console.error('[ActivityPlan] Failed to fetch user data:', err.message);
    const fallback = generateFallbackActivityPlan([]);
    return { plan: fallback, fromCache: false, status: 'fallback' };
  }
  if (!profile || !profile.profile) {
    const fallback = generateFallbackActivityPlan(dbActivities || []);
    return { plan: fallback, fromCache: false, status: 'fallback' };
  }
  const userProfile = profile.profile;
  const prompt = buildActivityPlanPrompt(userProfile, dbActivities || [], recentHistory || [], planDate);
  let plan;
  let attempt = 0;
  const maxAttempts = 2;
  while (attempt < maxAttempts) {
    attempt++;
    try {
      plan = await callLlmApi(prompt);
    } catch (err) {
      console.error(`[ActivityPlan] LLM API call attempt ${attempt} failed:`, err.message);
      if (attempt >= maxAttempts) {
        const fallback = generateFallbackActivityPlan(dbActivities || []);
        return { plan: fallback, fromCache: false, status: 'fallback' };
      }
      continue;
    }
    const structureCheck = validateActivityPlanStructure(plan, planDate);
    if (!structureCheck.valid) {
      console.warn(`[ActivityPlan] Structure validation failed (attempt ${attempt}):`, structureCheck.errors.join('; '));
      if (attempt < maxAttempts) continue;
      break;
    }
    plan.generated_at = new Date().toISOString();
    plan.llm_model = process.env.LLM_MODEL || 'unknown';
    plan.activities.forEach(a => { a.logged = false; });
    try {
      await upsertPlan(userId, planDate, plan, 'active');
    } catch (err) {
      console.error('[ActivityPlan] Failed to persist generated plan:', err.message);
    }
    setCachedPlan(userId, planDate, JSON.parse(JSON.stringify(plan)), 'activity');
    return { plan, fromCache: false, status: 'active' };
  }
  console.warn('[ActivityPlan] All generation attempts failed, returning fallback');
  const fallback = generateFallbackActivityPlan(dbActivities || []);
  fallback.generated_at = new Date().toISOString();
  fallback.llm_model = 'template-fallback';
  try {
    await upsertPlan(userId, planDate, fallback, 'fallback');
  } catch (err) {
    console.error('[ActivityPlan] Failed to persist fallback plan:', err.message);
  }
  return { plan: fallback, fromCache: false, status: 'fallback' };
}
