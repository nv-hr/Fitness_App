import { pool } from '../config/database.js';
import { AppError } from '../utils/errors.js';

export async function findByUserAndWeek(userId, weekStart, clientOverride, forUpdate = false) {
  const db = clientOverride || pool;
  try {
    const queryStr = `SELECT id, user_id, week_start, plan_data, status, created_at, updated_at
       FROM weekly_plans
       WHERE user_id = $1 AND week_start = $2` + (forUpdate ? ' FOR UPDATE' : '') + ' LIMIT 1';
    const { rows } = await db.query(queryStr, [userId, weekStart]);
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to find weekly plan: ${err.message}`, 500);
  }
}

export async function upsertPlan(userId, weekStart, planData, status = 'active', clientOverride) {
  const db = clientOverride || pool;
  try {
    const { rows } = await db.query(
      `INSERT INTO weekly_plans (user_id, week_start, plan_data, status)
       VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (user_id, week_start)
       DO UPDATE SET plan_data = $3::jsonb, status = $4, updated_at = NOW()
       RETURNING id, user_id, week_start, plan_data, status, created_at, updated_at`,
      [userId, weekStart, JSON.stringify(planData), status]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to upsert weekly plan: ${err.message}`, 500);
  }
}

/**
 * Dynamically synchronizes and updates the completed status for all workouts in a weekly plan
 * based on actual logged activities in the database.
 * Why: Ensures UI checkboxes reflect true activity logs by matching exact duration (time)
 * of the activity, so logs of different durations do not incorrectly mark plan items as completed.
 * @param {number} userId - User ID
 * @param {string} weekStart - Week start date string
 * @param {Object} planData - Plan JSON data
 * @param {Object} [clientOverride] - Client override for transaction
 * @returns {Promise<Object>} Updated plan data
 */
export async function syncWeeklyPlanCompletedStates(userId, weekStart, planData, clientOverride) {
  const db = clientOverride || pool;
  try {
    if (!planData || !Array.isArray(planData.days)) return planData;

    let changed = false;
    for (const day of planData.days) {
      if (!Array.isArray(day.activities) || day.activities.length === 0) continue;
      for (const activity of day.activities) {
        if (activity.activity_id) {
          const { rows } = await db.query(
            `SELECT duration_min
             FROM activity_logs
             WHERE user_id = $1 AND logged_date = $2 AND activity_id = $3`,
            [userId, day.date, activity.activity_id]
          );
          const loggedDurations = rows.map(r => Number(r.duration_min));
          const shouldBeCompleted = loggedDurations.includes(Number(activity.duration_min));
          if (activity.completed !== shouldBeCompleted) {
            activity.completed = shouldBeCompleted;
            changed = true;
          }
        }
      }

      // Recompute day-level completed flag
      const allCompleted = day.activities.length > 0 && day.activities.every(a => a.completed === true);
      const shouldDayBeCompleted = allCompleted;
      if (day.completed !== shouldDayBeCompleted) {
        if (shouldDayBeCompleted) {
          day.completed = true;
        } else {
          delete day.completed;
        }
        changed = true;
      }
    }

    if (changed) {
      const planRow = await findByUserAndWeek(userId, weekStart, clientOverride);
      const status = planRow ? planRow.status : 'active';
      const updatedRow = await upsertPlan(userId, weekStart, planData, status, clientOverride);
      return updatedRow ? updatedRow.plan_data : planData;
    }

    return planData;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to sync weekly plan completed states: ${err.message}`, 500);
  }
}

