import { apiGet, apiPost } from '../../../shared/lib/http.js';

export async function getWeeklyPlan(weekStart) {
  const params = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : '';
  return apiGet(`/api/weekly-plans${params}`);
}

export async function generateWeeklyPlan(weekStart) {
  return apiPost('/api/weekly-plans/generate', { weekStart });
}

export async function regenerateDay(weekStart, dayIndex) {
  return apiPost('/api/weekly-plans/regenerate-day', { weekStart, dayIndex });
}
