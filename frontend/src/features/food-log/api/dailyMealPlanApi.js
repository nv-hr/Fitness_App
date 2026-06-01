import { apiGet, apiPost } from '../../../shared/lib/http.js';

export async function getDailyMealPlan(date) {
  const params = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiGet(`/api/daily-meal-plans${params}`);
}

export async function generateDailyMealPlan(date) {
  return apiPost('/api/daily-meal-plans/generate', { date });
}

export async function logMeals(date, mealTypes) {
  return apiPost('/api/daily-meal-plans/log', { date, mealTypes });
}

export async function toggleItemLogged(date, mealType, foodId, logged) {
  return apiPost('/api/daily-meal-plans/toggle-item', { date, mealType, foodId, logged });
}

export async function swapMealItem(date, mealType, foodId) {
  return apiPost('/api/daily-meal-plans/swap-item', { date, mealType, foodId });
}
