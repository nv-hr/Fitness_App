/**
 * Intensity multipliers for calorie preview.
 * Matches server-side formula in activityLog.service.js.
 */
const INTENSITY_MULTIPLIERS = {
  light: 0.7,
  moderate: 1.0,
  vigorous: 1.3,
};

/**
 * Calculates preview calories for an activity session.
 * Formula: estimatedCalories * (durationMin / activityDurationMin) * intensityMultiplier
 * Returns null if any input is invalid.
 * Matches server-authoritative formula; display only.
 *
 * @param {number|null} estimatedCalories - Base calories for the activity
 * @param {number} activityDurationMin - Base duration in minutes for the activity
 * @param {string|number} durationMin - Actual duration in minutes
 * @param {string} intensity - 'light', 'moderate', or 'vigorous'
 * @returns {number|null} Rounded calorie value, or null if invalid
 */
export function calculateActivityCalories(estimatedCalories, activityDurationMin, durationMin, intensity) {
  const dur = parseInt(durationMin, 10);
  if (!estimatedCalories || !activityDurationMin || isNaN(dur) || dur < 1 || dur > 1440) {
    return null;
  }
  const multiplier = INTENSITY_MULTIPLIERS[intensity] || 1.0;
  return Math.round(estimatedCalories * (dur / activityDurationMin) * multiplier);
}
