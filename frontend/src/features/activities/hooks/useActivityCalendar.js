/**
 * useActivityCalendar.js
 *
 * Why: ActivityCalendarSection.jsx was 453 lines because it mixed UI rendering
 * with all the API-calling, state management, and countdown-timer logic.
 * Extracting that logic here brings the component down to ~90 lines of pure
 * layout code, and eliminates the duplicate formatCountdown + timer patterns
 * that already existed in MealCalendarSection.
 */

import { useState, useEffect, useCallback } from 'react';
import { format, isToday, startOfToday, startOfWeek, startOfMonth } from 'date-fns';
import {
  getWeeklyPlan,
  generateWeeklyPlan,
  swapActivity,
  toggleActivityComplete,
  regenerateDay,
} from '../api/activityCalendarApi.js';
import { useCountdownTimer } from '../../../shared/hooks/useCountdownTimer.js';

/**
 * Manages all state and API interactions for the activity calendar view.
 *
 * @param {Function} [onDaySelect]    - Optional callback when the selected day changes.
 * @param {Function} [onMonthChange]  - Optional callback when the visible month changes.
 * @returns {{
 *   selectedDay: Date,
 *   dayPlan: object|null,
 *   planLoading: boolean,
 *   generating: boolean,
 *   genRetryAfter: number|null,
 *   swappingActivityId: string|null,
 *   swapRetryAfter: number|null,
 *   completedActivities: Set<string>,
 *   toast: {message:string}|null,
 *   isNotToday: boolean,
 *   handlePrevDay: Function,
 *   handleNextDay: Function,
 *   handleGoToToday: Function,
 *   handleGenerateWeek: Function,
 *   handleSwap: Function,
 *   handleToggleComplete: Function,
 *   dismissToast: Function,
 * }}
 */
export function useActivityCalendar(onDaySelect, onMonthChange) {
  const [selectedDay, setSelectedDay] = useState(() => startOfToday());
  const [dayPlan, setDayPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [swappingActivityId, setSwappingActivityId] = useState(null);
  const [completedActivities, setCompletedActivities] = useState(() => new Set());
  const [toast, setToast] = useState(null);

  const { remaining: genRetryAfter, setRemaining: setGenRetryAfter } = useCountdownTimer(null);
  const { remaining: swapRetryAfter, setRemaining: setSwapRetryAfter } = useCountdownTimer(null);

  // ── Day navigation ──────────────────────────────────────────────────────────

  const handlePrevDay = useCallback(() => {
    setSelectedDay((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      if (onDaySelect) onDaySelect(d);
      return d;
    });
  }, [onDaySelect]);

  const handleNextDay = useCallback(() => {
    setSelectedDay((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      if (onDaySelect) onDaySelect(d);
      return d;
    });
  }, [onDaySelect]);

  const handleGoToToday = useCallback(() => {
    const today = startOfToday();
    setSelectedDay(today);
    if (onDaySelect) onDaySelect(today);
  }, [onDaySelect]);

  // Sync parent's currentMonth so the monthly calendar stays aligned
  useEffect(() => {
    if (selectedDay && onMonthChange) {
      onMonthChange(startOfMonth(selectedDay));
    }
  }, [selectedDay, onMonthChange]);

  // ── Fetch plan for selected day ─────────────────────────────────────────────

  useEffect(() => {
    if (!selectedDay) { setDayPlan(null); return; }

    const weekStart = format(startOfWeek(selectedDay, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    let cancelled = false;

    async function fetchDayPlan() {
      setPlanLoading(true);
      try {
        const res = await getWeeklyPlan(weekStart);
        const plan = res.data?.plan;
        if (cancelled) return;

        if (plan?.days) {
          const dateStr = format(selectedDay, 'yyyy-MM-dd');
          const found = plan.days.find((d) => d.date === dateStr) ?? null;
          setDayPlan(found);

          if (found?.activities) {
            const completed = new Set(
              found.activities.filter((a) => a.completed).map((a) => a.activity_id)
            );
            setCompletedActivities(completed);
          }
        } else {
          setDayPlan(null);
        }
      } catch {
        if (!cancelled) setDayPlan({ date: format(selectedDay, 'yyyy-MM-dd'), activities: [] });
      } finally {
        if (!cancelled) setPlanLoading(false);
      }
    }

    fetchDayPlan();
    return () => { cancelled = true; };
  }, [selectedDay]);

  // ── Auto-generate plan for today if it's missing ────────────────────────────

  useEffect(() => {
    if (!selectedDay) return;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const selStr = format(selectedDay, 'yyyy-MM-dd');

    if (selStr === todayStr && !planLoading && !dayPlan && !generating && genRetryAfter === null) {
      (async () => {
        setGenerating(true);
        try {
          const weekStart = format(startOfWeek(selectedDay, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          await generateWeeklyPlan(weekStart, 4);
          const planRes = await getWeeklyPlan(weekStart);
          const plan = planRes.data?.plan;
          if (plan?.days) {
            const found = plan.days.find((d) => d.date === todayStr);
            if (found) setDayPlan(found);
          }
        } catch (err) {
          if (err.retryAfter || err.code === 'RATE_LIMITED') {
            setGenRetryAfter(err.retryAfter || 150);
          }
        } finally {
          setGenerating(false);
        }
      })();
    }
  }, [selectedDay, planLoading, dayPlan, generating, genRetryAfter, setGenRetryAfter]);

  // ── Manual full-week regeneration ───────────────────────────────────────────

  const handleGenerateWeek = useCallback(async () => {
    try {
      setGenerating(true);
      setGenRetryAfter(null);

      const targetDay = selectedDay || new Date();
      const weekStart = format(startOfWeek(targetDay, { weekStartsOn: 1 }), 'yyyy-MM-dd');

      // regenerateDay at index 0 forces the LLM to build a fresh 7-day plan
      const resRegen = await regenerateDay(weekStart, 0, 4);
      const plan = resRegen.data?.plan;

      if (plan && Array.isArray(plan.days)) {
        // Silent database sync: double-toggle on today's first activity
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayIdx = plan.days.findIndex((d) => d.date === todayStr);
        const todayDay = todayIdx !== -1 ? plan.days[todayIdx] : null;

        if (todayDay?.activities?.length > 0) {
          const first = todayDay.activities[0];
          try {
            await toggleActivityComplete(weekStart, todayIdx, first.activity_id, !first.completed);
            await toggleActivityComplete(weekStart, todayIdx, first.activity_id, !!first.completed);
          } catch (e) {
            console.warn('Silent sync toggle failed:', e);
          }
        }

        if (selectedDay) {
          const dateStr = format(selectedDay, 'yyyy-MM-dd');
          const found = plan.days.find((d) => d.date === dateStr);
          if (found) {
            setDayPlan(found);
            const completed = new Set(
              found.activities?.filter((a) => a.completed).map((a) => a.activity_id)
            );
            setCompletedActivities(completed);
          }
        }
      }
      window.dispatchEvent(new CustomEvent('health-system-update'));
    } catch (err) {
      if (err.retryAfter || err.code === 'RATE_LIMITED') {
        setGenRetryAfter(err.retryAfter || 150);
      } else {
        setToast({ message: err.message || 'Failed to generate plan' });
      }
    } finally {
      setGenerating(false);
    }
  }, [selectedDay, setGenRetryAfter]);

  // ── Swap a single activity ──────────────────────────────────────────────────

  const handleSwap = useCallback(async (activityId, dayIndex) => {
    if (swapRetryAfter > 0 || !selectedDay) return;

    const weekStart = format(startOfWeek(selectedDay, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    try {
      setSwappingActivityId(activityId);
      const res = await swapActivity(weekStart, activityId, dayIndex);
      if (res.data?.plan) {
        const dateStr = format(selectedDay, 'yyyy-MM-dd');
        const found = res.data.plan.days.find((d) => d.date === dateStr);
        if (found) setDayPlan(found);
      }
      window.dispatchEvent(new CustomEvent('health-system-update'));
    } catch (err) {
      if (err.retryAfter || err.code === 'RATE_LIMITED') {
        setSwapRetryAfter(err.retryAfter || 300);
        setToast({ message: `Daily workout swap limit reached. Please wait ${err.retryAfter || 300}s.` });
      } else if (err.code === 'NOT_FOUND_ERROR') {
        setToast({ message: 'Activity not found in active plan.' });
      } else {
        setToast({ message: 'Unable to swap activity.' });
      }
    } finally {
      setSwappingActivityId(null);
    }
  }, [selectedDay, swapRetryAfter, setSwapRetryAfter]);

  // ── Optimistic toggle of activity completion ────────────────────────────────

  const handleToggleComplete = useCallback(async (activityId, dayIndex, currentCompleted) => {
    if (!selectedDay) return;

    const weekStart = format(startOfWeek(selectedDay, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const newCompleted = !currentCompleted;

    setCompletedActivities((prev) => {
      const next = new Set(prev);
      newCompleted ? next.add(activityId) : next.delete(activityId);
      return next;
    });

    try {
      await toggleActivityComplete(weekStart, dayIndex, activityId, newCompleted);
      window.dispatchEvent(new CustomEvent('health-system-update'));
    } catch (err) {
      // Roll back optimistic update on failure
      setCompletedActivities((prev) => {
        const next = new Set(prev);
        !newCompleted ? next.add(activityId) : next.delete(activityId);
        return next;
      });
      setToast({ message: err.message || 'Failed to update activity completion status' });
    }
  }, [selectedDay]);

  // ── Derived state ────────────────────────────────────────────────────────────

  const isNotToday = selectedDay ? !isToday(selectedDay) : true;

  return {
    selectedDay,
    dayPlan,
    planLoading,
    generating,
    genRetryAfter,
    swappingActivityId,
    swapRetryAfter,
    completedActivities,
    toast,
    isNotToday,
    handlePrevDay,
    handleNextDay,
    handleGoToToday,
    handleGenerateWeek,
    handleSwap,
    handleToggleComplete,
    dismissToast: () => setToast(null),
  };
}
