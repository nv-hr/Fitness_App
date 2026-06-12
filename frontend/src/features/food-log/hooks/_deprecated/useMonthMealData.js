import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getDailyMealPlan } from '../api/dailyMealPlanApi.js';
import { buildMonthGrid } from '../../../shared/calendar/calendarUtils.js';

const DAY_STATUS = Object.freeze({
  INCOMPLETE: 'incomplete',
  COMPLETED: 'completed',
  PAST_INCOMPLETE: 'pastIncomplete',
});

function computeMealDayStatus(plan, isPast) {
  if (!plan || !plan.meals || plan.meals.length === 0) {
    return isPast ? DAY_STATUS.PAST_INCOMPLETE : DAY_STATUS.INCOMPLETE;
  }
  const allLogged = plan.meals.every(meal =>
    meal.items && meal.items.length > 0 && meal.items.every(item => item.logged)
  );
  if (allLogged) return DAY_STATUS.COMPLETED;
  return DAY_STATUS.INCOMPLETE;
}

export function useMonthMealData(date) {
  const gridDays = useMemo(() => buildMonthGrid(date), [date]);
  const dateStrings = useMemo(() => gridDays.map(d => format(d, 'yyyy-MM-dd')), [gridDays]);

  const queries = useMemo(() =>
    dateStrings.map(dateStr => ({
      queryKey: ['monthMealData', dateStr],
      queryFn: async () => {
        const res = await getDailyMealPlan(dateStr);
        return { date: dateStr, plan: res.data?.plan || null };
      },
      staleTime: 5 * 60 * 1000,
      retry: 1,
    })),
    [dateStrings]
  );

  const results = useQueries({ queries });

  const dayStatusMap = useMemo(() => {
    const map = new Map();
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    results.forEach(result => {
      if (!result.data) return;
      const { date: dateStr, plan } = result.data;
      const isPast = dateStr < todayStr;
      map.set(dateStr, computeMealDayStatus(plan, isPast));
    });

    return map;
  }, [results]);

  const loading = results.some(r => r.isLoading);
  const firstError = results.find(r => r.error)?.error || null;

  return {
    dayStatusMap,
    loading,
    error: firstError,
    refetch: () => results.forEach(r => r.refetch()),
  };
}
