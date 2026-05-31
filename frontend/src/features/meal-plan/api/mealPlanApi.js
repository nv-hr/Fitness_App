import { apiGet, apiPost } from '../../../shared/lib/http.js';

export async function getMealPlan(weekStart) {
  const params = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : '';
  return apiGet(`/api/meal-plans${params}`);
}

export async function generateMealPlan(weekStart) {
  return apiPost('/api/meal-plans/generate', { weekStart });
}

export async function regenerateDay(weekStart, dayIndex) {
  return apiPost('/api/meal-plans/regenerate-day', { weekStart, dayIndex });
}

export async function logDay(weekStart, dayIndex, mealType = null) {
  return apiPost('/api/meal-plans/log-day', { weekStart, dayIndex, mealType });
}
