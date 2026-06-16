import { apiGet, apiPost, apiDelete } from '../../../shared/lib/http.js';

export async function logWeight(data) {
  return apiPost('/api/progress/weight', {
    weightKg: data.weightKg,
    loggedDate: data.loggedDate,
    notes: data.notes || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}

export async function getWeightHistory(limit = 50) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return apiGet(`/api/progress/weight?limit=${limit}&timezone=${encodeURIComponent(tz)}`);
}

export async function deleteWeightEntry(id) {
  return apiDelete(`/api/progress/weight/${id}`);
}
