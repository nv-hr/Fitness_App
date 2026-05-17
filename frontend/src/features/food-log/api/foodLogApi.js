import { apiGet, apiPost } from '../../../shared/lib/http.js';

export async function searchFoods(query) {
  return apiGet(`/api/food/search?q=${encodeURIComponent(query)}`);
}

export async function createCustomFood(data) {
  return apiPost('/api/food', data);
}

export async function logFood(data) {
  return apiPost('/api/food/log', data);
}

export async function getDailySummary(date) {
  return apiGet(`/api/food/summary?date=${date}`);
}

export async function getLogHistory(days = 7) {
  return apiGet(`/api/food/history?days=${days}`);
}

export async function getRecentFoods() {
  return apiGet('/api/food/recent');
}
