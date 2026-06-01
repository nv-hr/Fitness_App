import { successResponse, errorResponse } from '../utils/response.js';
import { getRecommendations, getAllActivitiesByGoal } from '../services/activity.service.js';
import * as activityLogService from '../services/activityLog.service.js';
import { findByUserId as findProfileByUserId } from '../repositories/profile.repository.js';
import { getDailyTotal } from '../repositories/food.repository.js';
import { getCalorieTarget, calculateTdee } from '../services/profile.service.js';
import * as activityRepo from '../repositories/activity.repository.js';
import { getCachedPlan, setCachedPlan } from '../services/llm.service.js';
import { findByUserAndWeek, upsertPlan } from '../repositories/weeklyPlan.repository.js';

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
      activities = await activityRepo.getAllActivities(['lose_weight', 'maintain', 'gain_weight']);
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

    return successResponse(res, {
      ...log,
      logged_date: log.logged_date instanceof Date ? log.logged_date.toLocaleDateString('en-CA') : log.logged_date,
    }, 201);
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

function getMonday(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1;
  d.setUTCDate(d.getUTCDate() - day + diff);
  return d.toISOString().split('T')[0];
}

function formatDateLocal(d) {
  const date = d instanceof Date ? d : new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * DELETE /api/activities/log/:id — Delete an activity log entry.
 * Also un-checks the corresponding toggle in the weekly plan (best-effort).
 */
async function deleteActivityLog(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id < 1) {
      return errorResponse(res, 'Invalid log ID', 400, 'VALIDATION_ERROR');
    }

    // Fetch log entry first to get activity_id and logged_date
    const logEntry = await activityRepo.getActivityLogById(id, req.user.userId);
    if (!logEntry) {
      return errorResponse(res, 'Activity log not found', 404, 'NOT_FOUND');
    }

    // Delete the log entry
    await activityRepo.deleteActivityLog(id, req.user.userId);

    // Un-check the corresponding toggle in the weekly plan (best-effort)
    try {
      const loggedDate = formatDateLocal(logEntry.logged_date);
      const weekStart = getMonday(new Date(loggedDate));
      const targetDate = loggedDate;
      const activityId = logEntry.activity_id;
      const userId = req.user.userId;

      // Get plan from cache or DB
      let planData = getCachedPlan(userId, weekStart);
      let planStatus = 'active';
      if (!planData || !Array.isArray(planData.days)) {
        const dbPlan = await findByUserAndWeek(userId, weekStart);
        if (dbPlan && dbPlan.plan_data && Array.isArray(dbPlan.plan_data.days)) {
          planData = dbPlan.plan_data;
          planStatus = dbPlan.status || 'active';
        }
      }

      if (planData && Array.isArray(planData.days)) {
        const day = planData.days.find(d => {
          const dDate = d.date || '';
          return dDate === targetDate;
        });

        if (day && Array.isArray(day.activities)) {
          const actIdx = day.activities.findIndex(a => a.activity_id === activityId);
          if (actIdx !== -1 && day.activities[actIdx].completed === true) {
            day.activities[actIdx].completed = false;

            // Recompute day-level completed flag
            const allCompleted = day.activities.length > 0 && day.activities.every(a => a.completed === true);
            if (allCompleted) day.completed = true;
            else delete day.completed;

            await upsertPlan(userId, weekStart, planData, planStatus);
            setCachedPlan(userId, weekStart, planData);
          }
        }
      }
    } catch (planErr) {
      console.warn(`[deleteActivityLog] Failed to un-check plan toggle: ${planErr.message}`);
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
