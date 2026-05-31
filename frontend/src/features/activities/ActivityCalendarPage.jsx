import { useState, useEffect, useRef, useCallback } from 'react';
import { format, isBefore, startOfToday, startOfWeek, startOfMonth } from 'date-fns';
import { CalendarPageLayout, useMonthData } from '../../shared/calendar/index.js';
import DayActivityRow from '../weekly-plan/components/DayActivityRow.jsx';
import Toast from '../weekly-plan/components/Toast.jsx';
import { useResponsive } from '../../shared/hooks/useResponsive.js';
import {
  getWeeklyPlan,
  generateWeeklyPlan,
  swapActivity,
  toggleActivityComplete,
} from './api/activityCalendarApi.js';

export default function ActivityCalendarPage() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [dayPlan, setDayPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genRetryAfter, setGenRetryAfter] = useState(null);
  const [swappingActivityId, setSwappingActivityId] = useState(null);
  const [swapRetryAfter, setSwapRetryAfter] = useState(null);
  const [toast, setToast] = useState(null);
  const [completedActivities, setCompletedActivities] = useState(() => new Set());
  const monthNavRef = useRef(false);
  const { isMobile } = useResponsive();

  // Fetch week plan for selected day
  const fetchWeekFn = useCallback(async (weekStart) => {
    const res = await getWeeklyPlan(weekStart);
    return res.data;
  }, []);

  const { dayStatusMap, loading, error } = useMonthData(currentMonth, fetchWeekFn);

  // Handle month navigation — set guard to prevent auto-gen
  const handleMonthChange = useCallback((month) => {
    monthNavRef.current = true;
    setCurrentMonth(month);
  }, []);

  // Handle day selection
  const handleDaySelect = useCallback((day) => {
    setSelectedDay(day);
  }, []);

  // Fetch plan for selected day
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
          const found = plan.days.find(d => d.date === dateStr) || null;
          setDayPlan(found);

          // Initialize completed state from plan data if it has completed flags
          if (found?.activities) {
            const completed = new Set();
            found.activities.forEach((act) => {
              if (act.completed) completed.add(act.activity_id);
            });
            setCompletedActivities(completed);
          }
        } else {
          setDayPlan(null);
        }
      } catch (err) {
        if (!cancelled) setDayPlan({ date: format(selectedDay, 'yyyy-MM-dd'), activities: [] });
      } finally {
        if (!cancelled) setPlanLoading(false);
      }
    }

    fetchDayPlan();
    return () => { cancelled = true; };
  }, [selectedDay]);

  // Auto-generation logic — gated by monthNavRef to prevent firing on month navigation
  useEffect(() => {
    // Do NOT fire on month navigation — monthNavRef prevents this
    if (monthNavRef.current) {
      monthNavRef.current = false;
      return;
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const currentMonthStr = format(currentMonth, 'yyyy-MM');
    const todayMonthStr = format(new Date(), 'yyyy-MM');

    // Only auto-gen if viewing today's month
    if (currentMonthStr !== todayMonthStr) return;

    // Check dayStatusMap for today
    const todayStatus = dayStatusMap.get(todayStr);
    if (todayStatus && todayStatus !== 'incomplete') return; // Already has a plan

    (async () => {
      setGenerating(true);
      try {
        const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const res = await generateWeeklyPlan(weekStart, 4);
        if (res.data?.plan) {
          // Refetch the plan for today
          const planRes = await getWeeklyPlan(weekStart);
          const plan = planRes.data?.plan;
          if (plan?.days) {
            const found = plan.days.find(d => d.date === todayStr);
            if (found) setDayPlan(found);
          }
        }
      } catch (err) {
        if (err.retryAfter || err.code === 'RATE_LIMITED') {
          setGenRetryAfter(err.retryAfter || 150);
        }
        // Silently fail — user can manually generate
      } finally {
        setGenerating(false);
      }
    })();
  }, [currentMonth]); // Only run when currentMonth changes (page load = today)

  // Generate Week handler
  const handleGenerateWeek = useCallback(async () => {
    try {
      setGenerating(true);
      setGenRetryAfter(null);
      const targetDay = selectedDay || new Date();
      const weekStart = format(startOfWeek(targetDay, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      await generateWeeklyPlan(weekStart, 4);
      // After generation, refresh the plan for the selected day
      if (selectedDay) {
        const res = await getWeeklyPlan(weekStart);
        const plan = res.data?.plan;
        if (plan?.days) {
          const dateStr = format(selectedDay, 'yyyy-MM-dd');
          const found = plan.days.find(d => d.date === dateStr);
          if (found) setDayPlan(found);
        }
      }
    } catch (err) {
      if (err.retryAfter || err.code === 'RATE_LIMITED') {
        const retryAfter = err.retryAfter || 150;
        setGenRetryAfter(retryAfter);
      } else {
        setToast({ message: err.message || 'Failed to generate plan' });
      }
    } finally {
      setGenerating(false);
    }
  }, [selectedDay]);

  // Swap handler
  const handleSwap = useCallback(async (activityId, dayIndex) => {
    if (swapRetryAfter > 0) return;
    if (!selectedDay) return;

    const weekStart = format(startOfWeek(selectedDay, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    try {
      setSwappingActivityId(activityId);
      const res = await swapActivity(weekStart, activityId, dayIndex);
      if (res.data?.plan) {
        const dateStr = format(selectedDay, 'yyyy-MM-dd');
        const found = res.data.plan.days.find(d => d.date === dateStr);
        if (found) setDayPlan(found);
      }
    } catch (err) {
      if (err.retryAfter || err.code === 'RATE_LIMITED') {
        setSwapRetryAfter(err.retryAfter || 300);
        setToast({ message: `Swap limit reached. Please wait ${err.retryAfter || 300}s.` });
      } else if (err.code === 'NOT_FOUND_ERROR') {
        setToast({ message: 'Activity not found in current plan.' });
      } else {
        setToast({ message: 'Could not swap activity.' });
      }
    } finally {
      setSwappingActivityId(null);
    }
  }, [selectedDay, swapRetryAfter]);

  // Generate Week countdown
  useEffect(() => {
    if (genRetryAfter != null && genRetryAfter > 0) {
      const interval = setInterval(() => {
        setGenRetryAfter(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [genRetryAfter]);

  // Swap countdown
  useEffect(() => {
    if (swapRetryAfter != null && swapRetryAfter > 0) {
      const interval = setInterval(() => {
        setSwapRetryAfter(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [swapRetryAfter]);

  // Completion toggle handler
  const handleToggleComplete = useCallback(async (activityId, dayIndex, currentCompleted) => {
    if (!selectedDay) return;

    const weekStart = format(startOfWeek(selectedDay, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const newCompleted = !currentCompleted;

    // Optimistic update — update local state immediately
    setCompletedActivities(prev => {
      const next = new Set(prev);
      if (newCompleted) {
        next.add(activityId);
      } else {
        next.delete(activityId);
      }
      return next;
    });

    // Persist to backend (fire-and-forget — errors shown in toast)
    try {
      await toggleActivityComplete(weekStart, dayIndex, activityId, newCompleted);
    } catch (err) {
      // Revert on failure
      setCompletedActivities(prev => {
        const next = new Set(prev);
        if (!newCompleted) {
          next.add(activityId);
        } else {
          next.delete(activityId);
        }
        return next;
      });
      setToast({ message: err.message || 'Failed to update completion status' });
    }
  }, [selectedDay]);

  const isPast = selectedDay ? isBefore(selectedDay, startOfToday()) : false;

  return (
    <div style={{ maxWidth: isMobile ? '100%' : '600px', margin: '0 auto', padding: '0 0 2rem' }}>
      {toast && <Toast message={toast.message} onDismiss={() => setToast(null)} />}

      {/* Page title */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Activity Calendar
      </h2>

      {/* Generate Week button row — separate row above calendar (per D-01) */}
      <div style={{ marginBottom: '0.75rem' }}>
        {genRetryAfter != null && genRetryAfter > 0 ? (
          <button disabled style={{
            width: '100%', padding: '0.75rem 1rem', cursor: 'not-allowed',
            background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px',
            color: '#666', fontWeight: 'bold', fontSize: '0.875rem', minHeight: '44px',
          }}>
            Wait {Math.floor(genRetryAfter / 60)}:{String(genRetryAfter % 60).padStart(2, '0')}
          </button>
        ) : (
          <button
            onClick={handleGenerateWeek}
            disabled={generating}
            style={{
              width: '100%', padding: '0.75rem 1rem', cursor: generating ? 'not-allowed' : 'pointer',
              background: generating ? '#f3f4f6' : '#16a34a',
              border: generating ? '1px solid #e5e7eb' : '1px solid #16a34a',
              borderRadius: '4px',
              color: generating ? '#666' : '#fff',
              fontWeight: 'bold', fontSize: '0.875rem', minHeight: '44px',
            }}
          >
            {generating ? 'Generating...' : 'Generate Week'}
          </button>
        )}
      </div>

      {/* Calendar */}
      <CalendarPageLayout
        dayStatusMap={dayStatusMap}
        loading={loading}
        error={error}
        onMonthChange={handleMonthChange}
        onDaySelect={handleDaySelect}
      >
        {/* Day detail panel content — rendered inside DayDetailPanel when day selected */}
        {selectedDay && (
          <div>
            {planLoading ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#9ca3af' }}>
                Loading activities...
              </div>
            ) : dayPlan?.activities?.length > 0 ? (
              <div>
                {dayPlan.activities.map((activity, idx) => (
                  <DayActivityRow
                    key={activity.activity_id ?? idx}
                    activity={activity}
                    onSwap={isPast ? undefined : (activityId) => handleSwap(activityId, idx)}
                    isSwapping={swappingActivityId === activity.activity_id}
                    swapRetryAfter={swapRetryAfter}
                    onToggle={isPast ? undefined : () => handleToggleComplete(
                      activity.activity_id ?? idx,
                      idx,
                      completedActivities.has(activity.activity_id ?? idx)
                    )}
                    disabled={isPast}
                    completed={completedActivities.has(activity.activity_id ?? idx)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9ca3af' }}>
                {dayPlan?.rest_day
                  ? 'Rest day — no activities scheduled.'
                  : 'No activities planned for this day.'}
              </div>
            )}
          </div>
        )}
      </CalendarPageLayout>
    </div>
  );
}
