import { apiGet, apiPost, apiFetch } from '../../../shared/lib/http.js';

let profileCache = null;
let profilePromise = null;

function clearProfileCache() {
  profileCache = null;
  profilePromise = null;
}

export async function createProfile(data) {
  const result = await apiPost('/api/profile', {
    weightKg: data.weightKg,
    heightCm: data.heightCm,
    age: data.age,
    gender: data.gender,
    fitnessGoal: data.fitnessGoal,
    activityLevel: data.activityLevel,
    calorieRate: data.calorieRate,
    targetWeightKg: data.targetWeightKg || null,
    targetDate: data.targetDate || null,
  });
  clearProfileCache();
  return result;
}

export async function getProfile(forceRefresh = false) {
  if (forceRefresh) {
    clearProfileCache();
  }
  if (profileCache) return Promise.resolve(profileCache);
  if (!profilePromise) {
    profilePromise = apiGet('/api/profile')
      .then((res) => {
        profileCache = res;
        return res;
      })
      .catch((err) => {
        profilePromise = null;
        throw err;
      });
  }
  return profilePromise;
}

export async function updateProfile(data) {
  const result = await apiFetch('/api/profile', {
    method: 'PUT',
    body: JSON.stringify({
      weightKg: data.weightKg,
      heightCm: data.heightCm,
      age: data.age,
      gender: data.gender,
      fitnessGoal: data.fitnessGoal,
      activityLevel: data.activityLevel,
      calorieRate: data.calorieRate,
      targetWeightKg: data.targetWeightKg || null,
      targetDate: data.targetDate || null,
    }),
  });
  clearProfileCache();
  return result;
}
