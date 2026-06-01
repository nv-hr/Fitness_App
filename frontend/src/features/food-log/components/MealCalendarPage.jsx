import { useState, useEffect, useRef, useCallback } from 'react';
import { format, isBefore, startOfToday, startOfMonth } from 'date-fns';
import { CalendarPageLayout } from '../../../shared/calendar/index.js';
import { useMonthMealData } from '../hooks/useMonthMealData.js';
import { getDailyMealPlan, generateDailyMealPlan, logMeals } from '../api/dailyMealPlanApi.js';
import { useResponsive } from '../../../shared/hooks/useResponsive.js';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function MealCalendarPage() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [dayPlan, setDayPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genRetryAfter, setGenRetryAfter] = useState(null);
  const [loggingMeal, setLoggingMeal] = useState(null);
  const [toast, setToast] = useState(null);
  const monthNavRef = useRef(false);
  const { isMobile } = useResponsive();

  const { dayStatusMap, loading, error } = useMonthMealData(currentMonth);

  const handleMonthChange = useCallback((month) => {
    monthNavRef.current = true;
    setCurrentMonth(month);
  }, []);

  const handleDaySelect = useCallback((day) => {
    setSelectedDay(day);
  }, []);

  useEffect(() => {
    if (!selectedDay) { setDayPlan(null); return; }

    let cancelled = false;

    async function fetchDayPlan() {
      setPlanLoading(true);
      try {
        const dateStr = format(selectedDay, 'yyyy-MM-dd');
        const res = await getDailyMealPlan(dateStr);
        if (cancelled) return;
        setDayPlan(res.data?.plan || null);
      } catch (err) {
        if (!cancelled) setDayPlan(null);
      } finally {
        if (!cancelled) setPlanLoading(false);
      }
    }

    fetchDayPlan();
    return () => { cancelled = true; };
  }, [selectedDay]);

  useEffect(() => {
    if (monthNavRef.current) {
      monthNavRef.current = false;
      return;
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const currentMonthStr = format(currentMonth, 'yyyy-MM');
    const todayMonthStr = format(new Date(), 'yyyy-MM');

    if (currentMonthStr !== todayMonthStr) return;

    const todayStatus = dayStatusMap.get(todayStr);
    if (todayStatus && todayStatus !== 'incomplete') return;

    (async () => {
      setGenerating(true);
      try {
        const res = await generateDailyMealPlan(todayStr);
        if (res.data?.plan && selectedDay) {
          const selStr = format(selectedDay, 'yyyy-MM-dd');
          if (selStr === todayStr) setDayPlan(res.data.plan);
        }
      } catch (err) {
        if (err.retryAfter || err.code === 'RATE_LIMITED') {
          setGenRetryAfter(err.retryAfter || 150);
        }
      } finally {
        setGenerating(false);
      }
    })();
  }, [currentMonth]);

  const handleGenerateDay = useCallback(async () => {
    try {
      setGenerating(true);
      setGenRetryAfter(null);
      const targetDay = selectedDay || new Date();
      const dateStr = format(targetDay, 'yyyy-MM-dd');
      const res = await generateDailyMealPlan(dateStr);
      if (res.data?.plan) {
        setDayPlan(res.data.plan);
      }
    } catch (err) {
      if (err.retryAfter || err.code === 'RATE_LIMITED') {
        setGenRetryAfter(err.retryAfter || 150);
      } else {
        setToast({ message: err.message || 'Failed to generate meal plan' });
      }
    } finally {
      setGenerating(false);
    }
  }, [selectedDay]);

  const handleLogMeal = useCallback(async (mealType) => {
    if (!selectedDay) return;
    const dateStr = format(selectedDay, 'yyyy-MM-dd');

    try {
      setLoggingMeal(mealType);
      await logMeals(dateStr, [mealType]);
      const res = await getDailyMealPlan(dateStr);
      if (res.data?.plan) {
        setDayPlan(res.data.plan);
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to log meal' });
    } finally {
      setLoggingMeal(null);
    }
  }, [selectedDay]);

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

  const isPast = selectedDay ? isBefore(selectedDay, startOfToday()) : false;

  const renderDayContent = () => {
    if (planLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '1rem', color: '#9ca3af' }}>
          Loading meal plan...
        </div>
      );
    }

    if (!dayPlan || !dayPlan.meals || dayPlan.meals.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9ca3af' }}>
          No meal plan for this day.
        </div>
      );
    }

    const sortedMeals = [...dayPlan.meals].sort(
      (a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type)
    );

    return (
      <div>
        {dayPlan.total_calories > 0 && (
          <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            Total: ~{dayPlan.total_calories} kcal
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sortedMeals.map((meal) => {
            const allLogged = meal.items?.every(item => item.logged);
            return (
              <div key={meal.meal_type} style={{
                border: '1px solid #e5e7eb', borderRadius: '4px', padding: '0.5rem',
                opacity: isPast ? 0.6 : 1,
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '0.25rem',
                }}>
                  <strong style={{ textTransform: 'capitalize' }}>{meal.meal_type}</strong>
                  <div>
                    {meal.total_calories > 0 && (
                      <span style={{ color: '#666', fontSize: '0.8rem', marginRight: '0.5rem' }}>
                        {meal.total_calories} kcal
                      </span>
                    )}
                    {allLogged ? (
                      <span style={{ color: '#16a34a', fontSize: '0.8rem' }}>Logged ✓</span>
                    ) : isPast ? (
                      <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Not logged</span>
                    ) : (
                      <button
                        onClick={() => handleLogMeal(meal.meal_type)}
                        disabled={loggingMeal === meal.meal_type}
                        style={{
                          padding: '0.25rem 0.6rem', cursor: 'pointer',
                          fontSize: '0.8rem', border: '1px solid #e5e7eb',
                          borderRadius: '4px', background: '#fff', minHeight: '44px',
                        }}
                      >
                        {loggingMeal === meal.meal_type ? '...' : 'Log'}
                      </button>
                    )}
                  </div>
                </div>
                {meal.items && meal.items.length > 0 && (
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    {meal.items.map((item, i) => (
                      <span key={i}>
                        {i > 0 && ', '}
                        {item.food_name} ({item.portion_grams}g
                        {item.calories ? `, ${item.calories} cal` : ''})
                        {item.logged ? ' ✓' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: isMobile ? '100%' : '600px', margin: '0 auto', padding: '0 0 2rem' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000,
          backgroundColor: '#fef2f2', color: '#991b1b', padding: '0.75rem 1rem',
          borderRadius: '4px', border: '1px solid #fecaca', fontSize: '0.875rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          {toast.message}
          <button onClick={() => setToast(null)} style={{
            marginLeft: '1rem', cursor: 'pointer', border: 'none',
            background: 'none', color: '#991b1b', fontWeight: 'bold', minHeight: '44px',
          }}>✕</button>
        </div>
      )}

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Meal Calendar
      </h2>

      <div style={{ marginBottom: '0.75rem' }}>
        {genRetryAfter != null && genRetryAfter > 0 ? (
          <button disabled style={{
            width: '100%', padding: '0.75rem 1rem', cursor: 'not-allowed',
            background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px',
            color: '#666', fontWeight: 'bold', fontSize: '0.875rem', minHeight: '44px',
          }}>
            Wait {formatCountdown(genRetryAfter)}
          </button>
        ) : (
          <button
            onClick={handleGenerateDay}
            disabled={generating}
            style={{
              width: '100%', padding: '0.75rem 1rem',
              cursor: generating ? 'not-allowed' : 'pointer',
              background: generating ? '#f3f4f6' : '#16a34a',
              border: generating ? '1px solid #e5e7eb' : '1px solid #16a34a',
              borderRadius: '4px',
              color: generating ? '#666' : '#fff',
              fontWeight: 'bold', fontSize: '0.875rem', minHeight: '44px',
            }}
          >
            {generating ? 'Generating...' : 'Generate Day'}
          </button>
        )}
      </div>

      <CalendarPageLayout
        dayStatusMap={dayStatusMap}
        loading={loading}
        error={error}
        onMonthChange={handleMonthChange}
        onDaySelect={handleDaySelect}
      >
        {selectedDay && renderDayContent()}
      </CalendarPageLayout>
    </div>
  );
}
