import { apiGet, apiPost, apiFetch } from '../../../shared/lib/http.js';

export async function createProfile(data) {
  return apiPost('/api/profile', {
    weightKg: data.weightKg,
    heightCm: data.heightCm,
    age: data.age,
    gender: data.gender,
    fitnessGoal: data.fitnessGoal,
  });
}

export async function getProfile() {
  return apiGet('/api/profile');
}

export async function updateProfile(data) {
  return apiFetch('/api/profile', {
    method: 'PUT',
    body: JSON.stringify({
      weightKg: data.weightKg,
      heightCm: data.heightCm,
      age: data.age,
      gender: data.gender,
      fitnessGoal: data.fitnessGoal,
    }),
  });
}
