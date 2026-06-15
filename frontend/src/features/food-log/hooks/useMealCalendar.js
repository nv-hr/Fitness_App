/**
 * useMealCalendar.js
 *
 * Why: MealCalendarSection.jsx was 618 lines because it mixed UI rendering
 * with all the API-calling, state management, and countdown timer logic.
 * Extracting that logic into this hook brings the component down to ~100 lines
 * of pure layout code, makes the business logic independently testable, and
 * makes it reusable if another surface ever needs the same meal-plan data.
 */

import { useState, useEffect, useCallback } from 'react';
import { format, startOfToday } from 'date-fns';
import {
  getDailyMealPlan,
  generateDailyMealPlan,
  logMeals,
  toggleItemLogged,
  regenerateCategoryStream,
} from '../api/dailyMealPlanApi.js';
import { useCountdownTimer } from '../../../shared/hooks/useCountdownTimer.js';
import { usePollingWithBackoff } from '../../../shared/hooks/usePollingWithBackoff.js';

/**
 * Manages all state and API interactions for the meal calendar view.
 *
 * @param {Function} [onDaySelect] - Optional callback invoked whenever the selected day changes.
 * @returns {{
 *   selectedDay: Date,
 *   dayPlan: object|null,
 *   planLoading: boolean,
 *   generating: boolean,
 *   generatingStatus: string,
 *   genRetryAfter: number|null,
 *   loggingMeal: string|null,
 *   regeneratingCategory: string|null,
 *   swapRetryAfter: number|null,
 *   toast: {message:string}|null,
 *   isNotToday: boolean,
 *   handlePrevDay: Function,
 *   handleNextDay: Function,
 *   handleGoToToday: Function,
 *   handleGenerateDay: Function,
 *   handleLogMeal: Function,
 *   handleToggleItem: Function,
 *   handleRegenerateCategory: Function,
 *   dismissToast: Function,
 * }}
 */
export function useMealCalendar(onDaySelect) {
  const [selectedDay, setSelectedDay] = useState(() => startOfToday());
  const [dayPlan, setDayPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [loggingMeal, setLoggingMeal] = useState(null);
  const [regeneratingCat, setRegeneratingCat] = useState(null);
  const [toast, setToast] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handleUpdate = (e) => {
      if (!e.detail || e.detail.type === 'plan-update' || e.detail.type === 'food-log') {
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

  // ── Fetch plan for selected day ─────────────────────────────────────────────

  useEffect(() => {
    if (!selectedDay) { setDayPlan(null); return; }

    let cancelled = false;

    async function fetchDayPlan() {
      setPlanLoading(true);
      try {
        const dateStr = format(selectedDay, 'yyyy-MM-dd');
        const res = await getDailyMealPlan(dateStr);
        if (!cancelled) setDayPlan(res.data?.plan || null);
      } catch {
        if (!cancelled) setDayPlan(null);
      } finally {
        if (!cancelled) setPlanLoading(false);
      }
    }

    fetchDayPlan();
    return () => { cancelled = true; };
  }, [selectedDay, refreshTrigger]);

  // ── Smart Polling ──────────────────────────────────────────────────────────

  const pollFn = useCallback(async (dateStr) => {
    const res = await getDailyMealPlan(dateStr);
    const plan = res.data?.plan;

    if (plan?.meals && plan.meals.length > 0) {
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

  const pollForDailyPlan = useCallback((dateStr) => {
    startPolling(dateStr);
  }, [startPolling]);

  // ── Manual full-day regeneration ────────────────────────────────────────────

  const handleGenerateDay = useCallback(async () => {
    try {
      setGenerating(true);
      setGeneratingStatus('Preparing...');
      setGenRetryAfter(null);

      const today = startOfToday();
      setSelectedDay(today);
      const dateStr = format(today, 'yyyy-MM-dd');

      let activeTodayPlan = null;
      try {
        const res0 = await getDailyMealPlan(dateStr);
        activeTodayPlan = res0.data?.plan || null;
      } catch (e) {
        console.warn("Failed to pre-fetch today's plan:", e);
      }

      if (!activeTodayPlan?.meals?.length) {
        setGeneratingStatus('Initializing plan...');
        const initRes = await generateDailyMealPlan(dateStr, { fallback: true });
        activeTodayPlan = initRes.data?.plan || null;
        if (activeTodayPlan) {
          setDayPlan(activeTodayPlan);
        } else {
          throw new Error('Failed to initialize placeholder meal plan');
        }
      }

      // Generate/regenerate each category sequentially with cache-busting toggles
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      let updatedPlan = activeTodayPlan;

      for (const mealType of mealTypes) {
        setGeneratingStatus(`Recreating ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}...`);

        const mealWithItems = updatedPlan?.meals?.find((m) => m.items?.length > 0);
        if (mealWithItems?.items?.length > 0) {
          const first = mealWithItems.items[0];
          try {
            await toggleItemLogged(dateStr, mealWithItems.meal_type, first.food_id, !first.logged);
            await toggleItemLogged(dateStr, mealWithItems.meal_type, first.food_id, !!first.logged);
          } catch (e) {
            console.warn('Cache-clear toggle failed:', e);
          }
        }

        // Await sequentially via a promise wrapper for category stream
        await new Promise((resolve, reject) => {
          regenerateCategoryStream(
            dateStr,
            mealType,
            (chunk) => {
              setGeneratingStatus(`Recreating ${mealType}: ${chunk}`);
            },
            (plan) => {
              if (plan) {
                updatedPlan = plan;
                setDayPlan(updatedPlan);
              }
              resolve();
            },
            (err) => {
              if (err.status === 409) {
                setGeneratingStatus('Generation in progress...');
                pollForDailyPlan(dateStr);
                reject(new Error('polling_started'));
              } else {
                reject(err);
              }
            }
          );
        });
      }
      setGenerating(false);
      setGeneratingStatus('');
      window.dispatchEvent(new CustomEvent('health-system-update', { detail: { type: 'plan-update' } }));
    } catch (err) {
      if (err.message === 'polling_started') {
        return;
      }
      if (err.retryAfter || err.code === 'RATE_LIMITED') {
        setGenRetryAfter(err.retryAfter || 150);
      } else {
        setToast({ message: err.message || 'Failed to generate meal plan' });
      }
      setGenerating(false);
      setGeneratingStatus('');
    }
  }, [setGenRetryAfter, pollForDailyPlan]);

  // Auto-generation on mount has been disabled by user request.
  // Users must manually trigger plan generation via the UI.
  // ── Log all items in a meal ─────────────────────────────────────────────────

  const handleLogMeal = useCallback(async (mealType) => {
    if (!selectedDay) return;
    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    try {
      setLoggingMeal(mealType);
      await logMeals(dateStr, [mealType]);
      const res = await getDailyMealPlan(dateStr);
      if (res.data?.plan) setDayPlan(res.data.plan);
      window.dispatchEvent(new CustomEvent('health-system-update', { detail: { type: 'food-log' } }));
    } catch (err) {
      setToast({ message: err.message || 'Failed to record meals' });
    } finally {
      setLoggingMeal(null);
    }
  }, [selectedDay]);

  // ── Optimistic toggle of a single food item ─────────────────────────────────

  const handleToggleItem = useCallback(async (mealType, foodId, currentLogged) => {
    if (!selectedDay) return;
    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    const newLogged = !currentLogged;

    /** Patch the plan state immutably for a single item. */
    const patchPlan = (plan, logged) => ({
      ...plan,
      meals: plan.meals.map((m) =>
        m.meal_type !== mealType
          ? m
          : { ...m, items: m.items.map((item) => item.food_id === foodId ? { ...item, logged } : item) }
      ),
    });

    setDayPlan((prev) => prev ? patchPlan(prev, newLogged) : prev);

    try {
      await toggleItemLogged(dateStr, mealType, foodId, newLogged);
      window.dispatchEvent(new CustomEvent('health-system-update', { detail: { type: 'food-log' } }));
    } catch (err) {
      // Roll back optimistic update on failure
      setDayPlan((prev) => prev ? patchPlan(prev, currentLogged) : prev);
      setToast({ message: err.message || 'Failed to update item status' });
    }
  }, [selectedDay]);

  // ── Regenerate a single meal category ──────────────────────────────────────

  const handleRegenerateCategory = useCallback(async (mealType) => {
    if (swapRetryAfter > 0 || !selectedDay) return;
    const dateStr = format(selectedDay, 'yyyy-MM-dd');

    try {
      setRegeneratingCat(mealType);

      // Cache-clearing toggle before calling regenerate
      const mealWithItems = dayPlan?.meals?.find((m) => m.items?.length > 0);
      if (mealWithItems?.items?.length > 0) {
        const first = mealWithItems.items[0];
        try {
          await toggleItemLogged(dateStr, mealWithItems.meal_type, first.food_id, !first.logged);
          await toggleItemLogged(dateStr, mealWithItems.meal_type, first.food_id, !!first.logged);
        } catch (e) {
          console.warn('Cache-clear toggle failed:', e);
        }
      }

      setGeneratingStatus(`Recreating ${mealType}...`);
      await new Promise((resolve, reject) => {
        regenerateCategoryStream(
          dateStr,
          mealType,
          (chunk) => {
            setGeneratingStatus(`Recreating ${mealType}: ${chunk}`);
          },
          (plan) => {
            if (plan) setDayPlan(plan);
            resolve();
          },
          (err) => {
            reject(err);
          }
        );
      });
      setGeneratingStatus('');
      window.dispatchEvent(new CustomEvent('health-system-update', { detail: { type: 'plan-update' } }));
    } catch (err) {
      if (err.status === 409) {
        setGeneratingStatus('Generation in progress...');
        pollForDailyPlan(dateStr);
        return;
      }
      setGeneratingStatus('');
      if (err.retryAfter || err.code === 'RATE_LIMITED') {
        setSwapRetryAfter(err.retryAfter || 300);
        setToast({ message: `AI regeneration limit reached. Please wait ${err.retryAfter || 300} seconds.` });
      } else {
        setToast({ message: err.message || 'Unable to regenerate meal category.' });
      }
    } finally {
      setRegeneratingCat(null);
    }
  }, [selectedDay, swapRetryAfter, dayPlan, setSwapRetryAfter, pollForDailyPlan]);

  // ── Derived state ────────────────────────────────────────────────────────────

  const isNotToday = selectedDay
    ? format(selectedDay, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')
    : true;

  return {
    selectedDay,
    dayPlan,
    planLoading,
    generating,
    generatingStatus,
    genRetryAfter,
    loggingMeal,
    regeneratingCategory: regeneratingCat,
    swapRetryAfter,
    toast,
    isNotToday,
    /** True whenever any write mutation (log, regenerate, generate) is in-flight.
     *  Used to disable all other action buttons and prevent conflicting requests. */
    isBusy: !!(loggingMeal || regeneratingCat || generating),
    handlePrevDay,
    handleNextDay,
    handleGoToToday,
    handleGenerateDay,
    handleLogMeal,
    handleToggleItem,
    handleRegenerateCategory,
    dismissToast: () => setToast(null),
  };
}
