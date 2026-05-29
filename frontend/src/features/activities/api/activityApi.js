import { apiGet, apiPost, apiDelete } from '../../../shared/lib/http.js';

export async function getRecommendations() {
  return apiGet('/api/activities/recommendations');
}

export async function getAllActivities() {
  return apiGet('/api/activities');
}

export async function logActivity(data) {
  return apiPost('/api/activities/log', data);
}

export async function getActivityLogs(date) {
  return apiGet(`/api/activities/logs?date=${date}`);
}

export async function getActivityHistory(days = 7) {
  return apiGet(`/api/activities/history?days=${days}`);
}

export async function deleteActivityLog(id) {
  return apiDelete(`/api/activities/log/${id}`);
}

export async function getActivitySummary(date) {
  return apiGet(`/api/activities/summary?date=${date}`);
}
