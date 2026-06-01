import { apiGet, apiPost } from '../../../shared/lib/http.js';

export async function getActivityPlan(date) {
  const params = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiGet(`/api/activity-plans${params}`);
}

export async function generateActivityPlan(date) {
  return apiPost('/api/activity-plans/generate', { date });
}

export async function logActivities(date, activityIndexes) {
  return apiPost('/api/activity-plans/log', { date, activityIndexes });
}
