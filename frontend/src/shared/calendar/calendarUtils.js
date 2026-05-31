import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  isBefore,
  format,
} from 'date-fns';

/**
 * Day status enum for calendar day cell color coding.
 * @enum {string}
 */
export const DAY_STATUS = Object.freeze({
  INCOMPLETE: 'incomplete',
  COMPLETED: 'completed',
  PAST_INCOMPLETE: 'pastIncomplete',
});

/**
 * Returns an array of Monday week-start dates for every week that overlaps
 * the given month. The first week start is the Monday on or before the 1st
 * of the month; the last week start is the Monday of the week that contains
 * the last day of the month. Typically returns 5-6 week starts.
 *
 * @param {Date} date — Any date within the target month
 * @returns {Date[]} — Array of Monday Date objects
 */
export function getWeekStartsForMonth(date) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  // Grid starts from the Monday on or before the 1st of the month
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  // Grid ends on the Sunday on or after the last day of the month
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const weekStarts = [];
  let current = gridStart;

  while (!isBefore(gridEnd, current)) {
    weekStarts.push(current);
    current = addDays(current, 7);
  }

  return weekStarts;
}

/**
 * Returns a flat array of all day Date objects in the visible calendar grid,
 * from the grid-start Monday to the grid-end Sunday.
 *
 * @param {Date} date — Any date within the target month
 * @returns {Date[]} — Array of Date objects for every day in the grid
 */
export function buildMonthGrid(date) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

/**
 * Computes the day status for a given day based on plan data and
 * whether the day is in the past.
 *
 * Priority:
 * 1. If planDay exists and completed → COMPLETED
 * 2. If isPast (and not completed or no plan) → PAST_INCOMPLETE
 * 3. Otherwise → INCOMPLETE
 *
 * @param {string} dateStr — Date string in 'YYYY-MM-DD' format
 * @param {Object|null} planDay — Plan day object with { date, completed }
 * @param {boolean} isPast — Whether this day is before today
 * @returns {string} — One of DAY_STATUS values
 */
export function computeDayStatus(dateStr, planDay, isPast) {
  if (planDay && planDay.completed) {
    return DAY_STATUS.COMPLETED;
  }

  if (isPast) {
    return DAY_STATUS.PAST_INCOMPLETE;
  }

  return DAY_STATUS.INCOMPLETE;
}
