import { apiGet, apiPost, apiDelete } from '../../../shared/lib/http.js';

export async function getAllActivities() {
  return apiGet('/api/activities');
}

export async function logActivity(data) {
  return apiPost('/api/activities/log', data);
}

async function getActivityLogs(date) {
  return apiGet(`/api/activities/logs?date=${encodeURIComponent(date)}`);
}

export async function getActivityHistory(days = 7, includeEntries = false) {
  let url = `/api/activities/history?days=${encodeURIComponent(days)}`;
  if (includeEntries) {
    url += '&includeEntries=true';
  }
  return apiGet(url);
}

export async function deleteActivityLog(id) {
  return apiDelete(`/api/activities/log/${encodeURIComponent(id)}`);
}

export async function getActivitySummary(date) {
  return apiGet(`/api/activities/summary?date=${encodeURIComponent(date)}`);
}
