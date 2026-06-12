import { apiGet, apiPost, fetchSseStream } from '../../../shared/lib/http.js';

export async function getWeeklyPlan(weekStart) {
  const params = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : '';
  return apiGet(`/api/weekly-plans${params}`);
}

export async function generateWeeklyPlan(weekStart, availableDays, force) {
  return apiPost('/api/weekly-plans/generate', {
    weekStart,
    ...(availableDays != null && { availableDays }),
    ...(force && { force }),
  });
}

export function generateWeeklyPlanStream(weekStart, availableDays, force, onChunk, onDone, onError) {
  return fetchSseStream('/api/weekly-plans/generate-stream', {
    weekStart,
    ...(availableDays != null && { availableDays }),
    ...(force && { force }),
  }, onChunk, onDone, onError);
}

export async function swapActivity(weekStart, activityId, dayIndex) {
  return apiPost('/api/weekly-plans/swap', { weekStart, activityId, dayIndex });
}

export function swapActivityStream(weekStart, activityId, dayIndex, onChunk, onDone, onError) {
  return fetchSseStream('/api/weekly-plans/swap-stream', { weekStart, activityId, dayIndex }, onChunk, onDone, onError);
}

/**
 * Toggle completion status for a specific activity in a weekly plan day.
 * POST to /api/weekly-plans/toggle-complete.
 *
 * @param {string} weekStart — Week start date (YYYY-MM-DD)
 * @param {number} dayIndex — Day index (0-6)
 * @param {number} activityId — Activity ID
 * @param {boolean} completed — New completion state
 * @returns {Promise<{ plan: object }>}
 */
export async function toggleActivityComplete(weekStart, dayIndex, activityId, completed) {
  return apiPost('/api/weekly-plans/toggle-complete', { weekStart, dayIndex, activityId, completed });
}

export async function regenerateDay(weekStart, dayIndex, availableDays) {
  return apiPost('/api/weekly-plans/regenerate-day', {
    weekStart,
    dayIndex,
    ...(availableDays != null && { availableDays }),
  });
}

export function regenerateDayStream(weekStart, dayIndex, availableDays, onChunk, onDone, onError) {
  return fetchSseStream('/api/weekly-plans/regenerate-day-stream', {
    weekStart,
    dayIndex,
    ...(availableDays != null && { availableDays }),
  }, onChunk, onDone, onError);
}

