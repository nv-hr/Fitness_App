import { apiGet } from '../../../shared/lib/http.js';

export async function getRecommendations() {
  return apiGet('/api/activities/recommendations');
}

export async function getAllActivities() {
  return apiGet('/api/activities');
}
