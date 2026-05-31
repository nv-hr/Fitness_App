import { apiGet, apiPost } from '../../../shared/lib/http.js'

export async function getWeeklyPlan(weekStart) {
  const params = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : ''
  return apiGet(`/api/weekly-plans${params}`)
}

export async function generateWeeklyPlan(weekStart, availableDays) {
  return apiPost('/api/weekly-plans/generate', {
    weekStart,
    ...(availableDays != null && { availableDays }),
  })
}

export async function regenerateDay(weekStart, dayIndex) {
  return apiPost('/api/weekly-plans/regenerate-day', { weekStart, dayIndex })
}

export async function swapActivity(weekStart, activityId, dayIndex) {
  return apiPost('/api/weekly-plans/swap', { weekStart, activityId, dayIndex })
}
