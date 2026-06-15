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
  toggleActivityComplete,
  generateWeeklyPlanStream,
  swapActivityStream,
} from '../api/activityCalendarApi.js';
import { useCountdownTimer } from '../../../shared/hooks/useCountdownTimer.js';
import { usePollingWithBackoff } from '../../../shared/hooks/usePollingWithBackoff.js';

const weeklyPlanCache = new Map();

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
 *   isPastDay: boolean,
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
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [swappingActivityId, setSwappingActivityId] = useState(null);
  const [completedActivities, setCompletedActivities] = useState(() => new Set());
  const [toast, setToast] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handleUpdate = (e) => {
      if (!e.detail || e.detail.type === 'plan-update' || e.detail.type === 'activity-log') {
        setRefreshTrigger((prev) => prev + 1);
      }
    };
    window.addEventListener('health-system-update', handleUpdate);
    return () => {
      window.removeEventListener('health-system-update', handleUpdate);
    };
  }, []);

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
    setDayPlan(null);
    setPlanLoading(true);
  }, [onDaySelect]);

  const handleNextDay = useCallback(() => {
    setSelectedDay((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      if (onDaySelect) onDaySelect(d);
      return d;
    });
    setDayPlan(null);
    setPlanLoading(true);
  }, [onDaySelect]);

  const handleGoToToday = useCallback(() => {
    const today = startOfToday();
    setSelectedDay(today);
    setDayPlan(null);
    setPlanLoading(true);
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
        let plan;
        // If refreshTrigger > 0, it means we got a health-system-update and should bypass cache
        const forceRefresh = refreshTrigger > 0;
        if (!forceRefresh && weeklyPlanCache.has(weekStart)) {
          plan = weeklyPlanCache.get(weekStart);
        } else {
          const res = await getWeeklyPlan(weekStart);
          plan = res.data?.plan;
          if (plan) weeklyPlanCache.set(weekStart, plan);
        }
        
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
  }, [selectedDay, refreshTrigger]);

  // ── Smart Polling ──────────────────────────────────────────────────────────

  const pollFn = useCallback(async (weekStart) => {
    const res = await getWeeklyPlan(weekStart);
    const plan = res.data?.plan;

    if (plan?.days && plan.days.length > 0) {
      weeklyPlanCache.set(weekStart, plan);
      setRefreshTrigger(prev => prev + 1);
      window.dispatchEvent(new CustomEvent('health-system-update', { detail: { type: 'plan-update' } }));
      setGenerating(false);
      setGeneratingStatus('');
      return true;
    }
    return false;
  }, []);

  const handlePollTimeout = useCallback(() => {
    setGenerating(false);
    setGeneratingStatus('');
    setToast({ message: 'Plan generation timed out. Please try again.' });
  }, []);

  const startPolling = usePollingWithBackoff(pollFn, {
    initialDelay: 3000,
    maxAttempts: 10,
    factor: 1.5,
    onTimeout: handlePollTimeout
  });

  const pollForWeeklyPlan = useCallback((weekStart) => {
    startPolling(weekStart);
  }, [startPolling]);

  // ── Auto-generate plan for today if it's missing ────────────────────────────

  // Auto-generation on mount has been disabled by user request.
  // Users must manually trigger plan generation via the UI.

  // ── Manual full-week regeneration ───────────────────────────────────────────

  const handleGenerateWeek = useCallback(() => {
    setGenerating(true);
    setGeneratingStatus('Connecting to AI...');
    setGenRetryAfter(null);

    const targetDay = selectedDay || new Date();
    const weekStart = format(startOfWeek(targetDay, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    generateWeeklyPlanStream(
      weekStart,
      4,
      true, // force
      (chunk) => {
        setGeneratingStatus(`Generating: ${chunk}`);
      },
      async (plan) => {
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
          weeklyPlanCache.set(weekStart, plan);
        }
        window.dispatchEvent(new CustomEvent('health-system-update', { detail: { type: 'plan-update' } }));
        setGenerating(false);
        setGeneratingStatus('');
      },
      (err) => {
        if (err.status === 409) {
          setGeneratingStatus('Generation in progress...');
          pollForWeeklyPlan(weekStart);
          return;
        }
        if (err.retryAfter || err.code === 'RATE_LIMITED') {
          setGenRetryAfter(err.retryAfter || 150);
        } else {
          setToast({ message: err.message || 'Failed to generate plan' });
        }
        setGenerating(false);
        setGeneratingStatus('');
      }
    );
  }, [selectedDay, setGenRetryAfter]);

  // ── Swap a single activity ──────────────────────────────────────────────────

  const handleSwap = useCallback((activityId, dayIndex) => {
    if (swapRetryAfter > 0 || !selectedDay) return;

    const weekStart = format(startOfWeek(selectedDay, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    setSwappingActivityId(`${dayIndex}-${activityId}`);
    swapActivityStream(
      weekStart,
      activityId,
      dayIndex,
      (chunk) => {
        // No action needed for intermediate swap chunks
      },
      (plan) => {
        if (plan?.days) {
          weeklyPlanCache.set(weekStart, plan);
          const dateStr = format(selectedDay, 'yyyy-MM-dd');
          const found = plan.days.find((d) => d.date === dateStr);
          if (found) setDayPlan(found);
        }
        window.dispatchEvent(new CustomEvent('health-system-update', { detail: { type: 'plan-update' } }));
        setSwappingActivityId(null);
      },
      (err) => {
        if (err.retryAfter || err.code === 'RATE_LIMITED') {
          setSwapRetryAfter(err.retryAfter || 300);
          setToast({ message: `Daily workout swap limit reached. Please wait ${err.retryAfter || 300}s.` });
        } else if (err.code === 'NOT_FOUND_ERROR') {
          setToast({ message: 'Activity not found in active plan.' });
        } else {
          setToast({ message: 'Unable to swap activity.' });
        }
        setSwappingActivityId(null);
      }
    );
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
      // Invalidate cache for this week
      weeklyPlanCache.delete(weekStart);
      window.dispatchEvent(new CustomEvent('health-system-update', { detail: { type: 'activity-log' } }));
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
  const isPastDay = selectedDay ? selectedDay < startOfToday() : false;

  return {
    selectedDay,
    dayPlan,
    planLoading,
    generating,
    generatingStatus,
    genRetryAfter,
    swappingActivityId,
    swapRetryAfter,
    completedActivities,
    toast,
    isNotToday,
    isPastDay,
    handlePrevDay,
    handleNextDay,
    handleGoToToday,
    handleGenerateWeek,
    handleSwap,
    handleToggleComplete,
    dismissToast: () => setToast(null),
  };
}
