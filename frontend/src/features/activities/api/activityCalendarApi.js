import { apiPost } from '../../../shared/lib/http.js';
import {
  getWeeklyPlan as wpGetWeeklyPlan,
  generateWeeklyPlan as wpGenerate,
  swapActivity as wpSwap,
} from '../../weekly-plan/api/weeklyPlanApi.js';

export const getWeeklyPlan = wpGetWeeklyPlan;
export const generateWeeklyPlan = wpGenerate;
export const swapActivity = wpSwap;

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
