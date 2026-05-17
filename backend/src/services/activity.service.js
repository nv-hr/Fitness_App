import { getRandomActivities, getAllActivities } from '../repositories/activity.repository.js';

/**
 * Map profile fitness_goal to activity goal_tags.
 * @param {string} fitnessGoal
 * @returns {string[]}
 */
export function mapFitnessGoalToTags(fitnessGoal) {
  const mapping = {
    lose_weight: ['lose_weight'],
    maintain: ['maintain'],
    gain_weight: ['gain_weight'],
  };
  return mapping[fitnessGoal] || ['lose_weight', 'maintain', 'gain_weight'];
}

/**
 * Get randomized activity recommendations for a user's fitness goal (D-45).
 * Falls back to all activities if none match the goal.
 * @param {number} userId
 * @param {string} fitnessGoal
 * @param {number} count
 * @returns {Promise<Array>}
 */
export async function getRecommendations(userId, fitnessGoal, count = 5) {
  const goalTags = mapFitnessGoalToTags(fitnessGoal);
  let activities = await getRandomActivities(userId, goalTags, count);

  // Fallback: if no activities found for goal, return all activities shuffled
  if (activities.length === 0) {
    activities = await getRandomActivities(userId, ['lose_weight', 'maintain', 'gain_weight'], count);
  }

  return activities;
}

/**
 * Get all activities filtered by user's fitness goal.
 * @param {number} userId
 * @param {string} fitnessGoal
 * @returns {Promise<Array>}
 */
export async function getAllActivitiesByGoal(userId, fitnessGoal) {
  const goalTags = mapFitnessGoalToTags(fitnessGoal);
  return getAllActivities(userId, goalTags);
}
