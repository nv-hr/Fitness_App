import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError } from '../utils/errors.js';

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
    ? activityHistory.map(a => `- ${a.logged_date || a.loggedDate}: ${a.activity_name} (${a.duration_min}min, ${a.intensity})`).join('\n')
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
    ],
    temperature: CONFIG.temperature,
    max_tokens: CONFIG.maxTokens,
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new AppError('LlmEmptyResponse', 'LLM returned empty response', 502);
  }

  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

export async function generateWeeklyPlan(deps) {
  const { getProfile, getActivityHistory, getActivities, userId, weekStart } = deps;

  const [profile, history, activities] = await Promise.all([
    getProfile(userId),
    getActivityHistory(userId, 14),
    getActivities(),
  ]);

  if (!profile) {
    throw new AppError('ProfileNotFound', 'User profile not found', 400);
  }

  const prompt = buildSystemPrompt(profile, history, activities, weekStart);
  return callLlmApi(prompt);
}
