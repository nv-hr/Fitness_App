import { apiGet, apiPost, apiDelete } from '../../../shared/lib/http.js';

export async function logWeight(data) {
  return apiPost('/api/progress/weight', {
    weightKg: data.weightKg,
    loggedDate: data.loggedDate,
    notes: data.notes || null,
  });
}

export async function getWeightHistory(limit = 50) {
  return apiGet(`/api/progress/weight?limit=${limit}`);
}

export async function deleteWeightEntry(id) {
  return apiDelete(`/api/progress/weight/${id}`);
}
