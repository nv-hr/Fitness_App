import { successResponse, errorResponse } from '../utils/response.js';
import { getRecommendations, getAllActivitiesByGoal } from '../services/activity.service.js';
import { findByUserId as findProfileByUserId } from '../repositories/profile.repository.js';

/**
 * GET /api/activities/recommendations — Randomized goal-based activity recommendations (ACT-01).
 */
async function getRecommendationsHandler(req, res, next) {
  try {
    // Fetch user profile for fitness_goal
    const profile = await findProfileByUserId(req.user.userId);

    let activities;
    if (profile && profile.fitness_goal) {
      activities = await getRecommendations(req.user.userId, profile.fitness_goal);
    } else {
      // Fallback: return all activities if no profile
      activities = await getRecommendations(req.user.userId, 'maintain');
    }

    return successResponse(res, { activities, count: activities.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/activities — Full activity pool filtered by user's goal.
 */
async function getAllActivitiesHandler(req, res, next) {
  try {
    const profile = await findProfileByUserId(req.user.userId);

    let activities;
    if (profile && profile.fitness_goal) {
      activities = await getAllActivitiesByGoal(req.user.userId, profile.fitness_goal);
    } else {
      // Fallback: return all activities if no profile
      const { getAllActivities: getAllFromRepo } = await import('../repositories/activity.repository.js');
      activities = await getAllFromRepo(req.user.userId, ['lose_weight', 'maintain', 'gain_weight']);
    }

    return successResponse(res, { activities, total: activities.length });
  } catch (err) {
    next(err);
  }
}

export default {
  getRecommendations: getRecommendationsHandler,
  getAllActivities: getAllActivitiesHandler,
};
