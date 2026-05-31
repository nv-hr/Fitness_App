import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getWeekStartsForMonth, computeDayStatus } from '../calendarUtils.js';

/**
 * Generic hook for fetching month-range plan data via 5-6 parallel
 * weekly plan fetches. Uses TanStack React Query's useQueries.
 *
 * @param {Date} date — The displayed month date (any date in the month)
 * @param {function} fetchWeekFn — Async function that accepts a weekStart
 *   date string (YYYY-MM-DD) and returns { plan: { days: [...] } }
 * @returns {{ dayStatusMap: Map<string, string>, loading: boolean, error: Error|null, refetch: function }}
 */
export function useMonthData(date, fetchWeekFn) {
  // 1. Compute week starts for the month range
  const weekStarts = useMemo(() => getWeekStartsForMonth(date), [date]);

  // 2. Create query keys and fetch configs for each week
  const weekStartStrings = useMemo(() =>
    weekStarts.map(d => format(d, 'yyyy-MM-dd')),
    [weekStarts]
  );

  const queries = useMemo(() =>
    weekStartStrings.map(weekStart => ({
      queryKey: ['calendarMonthData', weekStart],
      queryFn: () => fetchWeekFn(weekStart),
      staleTime: 5 * 60 * 1000, // 5 min — matches existing pattern
      retry: 1,
    })),
    [weekStartStrings, fetchWeekFn]
  );

  // 3. Execute all queries in parallel via useQueries
  const results = useQueries({ queries });

  // 4. Aggregate results into dayStatusMap
  const dayStatusMap = useMemo(() => {
    const map = new Map();
    const today = new Date();

    results.forEach(result => {
      if (!result.data?.plan?.days) return;
      result.data.plan.days.forEach(planDay => {
        const dateStr = planDay.date; // 'YYYY-MM-DD'
        const isPast = dateStr < format(today, 'yyyy-MM-dd');
        const status = computeDayStatus(dateStr, planDay, isPast);
        map.set(dateStr, status);
      });
    });

    return map;
  }, [results]);

  // 5. Compute loading and error states
  const loading = results.some(r => r.isLoading);
  const firstError = results.find(r => r.error)?.error || null;

  return {
    dayStatusMap,
    loading,
    error: firstError,
    refetch: () => results.forEach(r => r.refetch()),
  };
}
