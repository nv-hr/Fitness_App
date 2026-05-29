import { successResponse, errorResponse } from '../utils/response.js';
import { getRecommendations, getAllActivitiesByGoal } from '../services/activity.service.js';
import * as activityLogService from '../services/activityLog.service.js';
import { findByUserId as findProfileByUserId } from '../repositories/profile.repository.js';
import { getFoodById, getDailyTotal } from '../repositories/food.repository.js';
import { getCalorieTarget, calculateTdee } from '../services/profile.service.js';
import * as activityRepo from '../repositories/activity.repository.js';

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

/**
 * POST /api/activities/log — Log an activity (ACT-02).
 */
async function logActivity(req, res, next) {
  try {
    const { activityId, durationMin, intensity, loggedDate } = req.body;

    // Validate input
    activityLogService.validateActivityLogInput({ activityId, durationMin, intensity, loggedDate });

    // Fetch activity for calorie calculation
    const activity = await activityRepo.getActivityById(activityId);
    if (!activity) {
      return errorResponse(res, 'Activity not found', 404, 'NOT_FOUND');
    }

    // Calculate calories burned (server-authoritative)
    const caloriesBurned = activityLogService.calculateCaloriesBurned(activity, durationMin, intensity);

    // Default loggedDate to today
    const logDate = loggedDate || new Date().toISOString().split('T')[0];

    const log = await activityRepo.createActivityLog(req.user.userId, {
      activityId,
      durationMin,
      intensity,
      caloriesBurned,
      loggedDate: logDate,
    });

    return successResponse(res, log, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/activities/logs?date= — Get activity logs for a date.
 */
async function getActivityLogs(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const logs = await activityRepo.getActivityLogsByDate(req.user.userId, date);
    return successResponse(res, logs);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/activities/history?days=&includeEntries=true — Get activity history.
 * When includeEntries=true, returns fully grouped data with entry details.
 */
async function getActivityHistory(req, res, next) {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const includeEntries = req.query.includeEntries === 'true';

    if (includeEntries) {
      // Single query with JOIN — group by date in-memory
      const rows = await activityRepo.getActivityHistoryWithEntries(req.user.userId, days);
      const grouped = {};
      for (const row of rows) {
        const dateKey = row.logged_date instanceof Date
          ? row.logged_date.toLocaleDateString('en-CA')
          : String(row.logged_date).split('T')[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            logged_date: dateKey,
            total_minutes: 0,
            total_burned: 0,
            entries: [],
          };
        }
        grouped[dateKey].total_minutes += row.duration_min;
        grouped[dateKey].total_burned += row.calories_burned;
        grouped[dateKey].entries.push({
          id: row.id,
          activity_name: row.activity_name,
          duration_min: row.duration_min,
          intensity: row.intensity,
          calories_burned: row.calories_burned,
        });
      }
      const history = Object.values(grouped).sort((a, b) => b.logged_date.localeCompare(a.logged_date));
      return successResponse(res, history);
    }

    // Simple grouped history without detail entries
    const history = await activityRepo.getActivityHistory(req.user.userId, days);
    return successResponse(res, history);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/activities/log/:id — Delete an activity log entry.
 */
async function deleteActivityLog(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id < 1) {
      return errorResponse(res, 'Invalid log ID', 400, 'VALIDATION_ERROR');
    }

    const deletedId = await activityRepo.deleteActivityLog(id, req.user.userId);
    if (!deletedId) {
      return errorResponse(res, 'Activity log not found', 404, 'NOT_FOUND');
    }

    return successResponse(res, null, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/activities/summary?date= — Daily activity summary with net calories.
 */
async function getActivitySummary(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    // Parallel fetch: activity totals, food totals, user profile
    const [activityTotals, rawTotalConsumed, profile] = await Promise.all([
      activityRepo.getDailyActivityTotal(req.user.userId, date),
      getDailyTotal(req.user.userId, date),
      findProfileByUserId(req.user.userId),
    ]);

    const totalConsumed = Number(rawTotalConsumed);
    let calorieTarget = null;

    if (profile) {
      const tdee = calculateTdee(
        profile.weight_kg,
        profile.height_cm,
        profile.age,
        profile.gender,
        profile.activity_level
      );
      if (tdee) {
        calorieTarget = getCalorieTarget(tdee, profile.fitness_goal, profile.calorie_rate);
      }
    }

    const { netCalories, netVsTarget } = activityLogService.calculateDailyNetCalories(
      totalConsumed,
      activityTotals.total_burned,
      calorieTarget
    );

    return successResponse(res, {
      date,
      totalActiveMinutes: activityTotals.total_minutes,
      totalCaloriesBurned: activityTotals.total_burned,
      totalConsumed,
      calorieTarget,
      netCalories,
      netVsTarget,
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getRecommendations: getRecommendationsHandler,
  getAllActivities: getAllActivitiesHandler,
  logActivity,
  getActivityLogs,
  getActivityHistory,
  deleteActivityLog,
  getActivitySummary,
};
