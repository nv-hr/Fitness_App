/**
 * countdown.js
 *
 * Why: `formatCountdown` was duplicated identically in both
 * MealCalendarSection and ActivityCalendarSection. A single source of truth
 * prevents drift if the format ever needs to change (e.g. adding hours).
 */

/**
 * Formats a duration in seconds into an MM:SS string.
 *
 * @param {number} seconds - Total seconds remaining.
 * @returns {string} Formatted string, e.g. "2:05".
 */
export function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
