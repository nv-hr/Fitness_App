import { useState, useEffect, useRef, useCallback } from 'react';
import { format, isBefore, isAfter, isToday, startOfToday, startOfMonth } from 'date-fns';
import { CalendarPageLayout } from '../../../shared/calendar/index.js';
import { getDailyMealPlan, generateDailyMealPlan, logMeals, toggleItemLogged, swapMealItem } from '../api/dailyMealPlanApi.js';
import { useResponsive } from '../../../shared/hooks/useResponsive.js';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function MealCalendarSection({
  dayStatusMap,
  loading,
  error,
  onDaySelect: externalOnDaySelect,
  onMonthChange: externalOnMonthChange,
}) {
  useEffect(() => {
    if (!document.getElementById('swap-spin-style')) {
      const style = document.createElement('style');
      style.id = 'swap-spin-style';
      style.textContent = '@keyframes swap-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }
  }, []);

  const [selectedDay, setSelectedDay] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [dayPlan, setDayPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genRetryAfter, setGenRetryAfter] = useState(null);
  const [loggingMeal, setLoggingMeal] = useState(null);
  const [swappingItemKey, setSwappingItemKey] = useState(null);
  const [swapRetryAfter, setSwapRetryAfter] = useState(null);
  const [toast, setToast] = useState(null);
  const monthNavRef = useRef(false);
  const { isMobile } = useResponsive();

  const handleMonthChange = useCallback((month) => {
    monthNavRef.current = true;
    setCurrentMonth(month);
    if (externalOnMonthChange) externalOnMonthChange(month);
  }, [externalOnMonthChange]);

  const handleDaySelect = useCallback((day) => {
    setSelectedDay(day);
    if (externalOnDaySelect) externalOnDaySelect(day);
  }, [externalOnDaySelect]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, dayStatusMap]);

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

  const handleToggleItem = useCallback(async (mealType, foodId, currentLogged) => {
    if (!selectedDay) return;
    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    const newLogged = !currentLogged;

    setDayPlan(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        meals: prev.meals.map(m => {
          if (m.meal_type !== mealType) return m;
          return {
            ...m,
            items: m.items.map(item =>
              item.food_id === foodId ? { ...item, logged: newLogged } : item
            ),
          };
        }),
      };
    });

    try {
      await toggleItemLogged(dateStr, mealType, foodId, newLogged);
    } catch (err) {
      setDayPlan(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          meals: prev.meals.map(m => {
            if (m.meal_type !== mealType) return m;
            return {
              ...m,
              items: m.items.map(item =>
                item.food_id === foodId ? { ...item, logged: !newLogged } : item
              ),
            };
          }),
        };
      });
      setToast({ message: err.message || 'Failed to update item' });
    }
  }, [selectedDay]);

  const handleSwapItem = useCallback(async (mealType, foodId) => {
    if (swapRetryAfter > 0) return;
    if (!selectedDay) return;

    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    const itemKey = `${mealType}_${foodId}`;

    try {
      setSwappingItemKey(itemKey);
      const res = await swapMealItem(dateStr, mealType, foodId);
      if (res.data?.plan) {
        setDayPlan(res.data.plan);
      }
    } catch (err) {
      if (err.retryAfter || err.code === 'RATE_LIMITED') {
        setSwapRetryAfter(err.retryAfter || 300);
        setToast({ message: `Swap limit reached. Please wait ${err.retryAfter || 300}s.` });
      } else {
        setToast({ message: err.message || 'Could not swap item.' });
      }
    } finally {
      setSwappingItemKey(null);
    }
  }, [selectedDay, swapRetryAfter]);

  let isPast = false;
  let isNotToday = true;
  if (selectedDay) {
    const today = startOfToday();
    const sel = new Date(selectedDay);
    sel.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    isPast = sel < today;
    isNotToday = sel.getTime() !== today.getTime();
  }

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
                opacity: isNotToday ? 0.6 : allLogged ? 0.65 : 1,
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
                      <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Logged ✓</span>
                    ) : isNotToday ? (
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
                        {loggingMeal === meal.meal_type ? '...' : 'Log All'}
                      </button>
                    )}
                  </div>
                </div>
                {meal.items && meal.items.length > 0 && (
                  <div style={{ fontSize: '0.85rem' }}>
                    {meal.items.map((item, i) => {
                      const itemKey = `${meal.meal_type}_${item.food_id}`;
                      const isSwapping = swappingItemKey === itemKey;
                      return (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '0.3rem 0', borderBottom: i < meal.items.length - 1 ? '1px solid #f3f4f6' : 'none',
                          opacity: isSwapping ? 0.5 : 1,
                          transition: 'opacity 0.2s',
                        }}>
                          <span style={{ color: '#666' }}>
                            {item.food_name} ({item.portion_grams}g
                            {item.calories ? `, ${item.calories} cal` : ''})
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {/* Toggle button / logged badge */}
                            {item.logged ? (
                              <span style={{
                                width: '36px', height: '36px', minWidth: '36px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#9ca3af', fontSize: '14px', fontWeight: 'bold',
                              }} title="Logged">
                                ✓
                              </span>
                            ) : isNotToday ? null : (
                              <button
                                onClick={() => handleToggleItem(meal.meal_type, item.food_id, item.logged)}
                                style={{
                                  width: '36px', height: '36px', minWidth: '36px',
                                  padding: '6px', cursor: 'pointer',
                                  background: 'none',
                                  border: '2px solid #d1d5db',
                                  borderRadius: '50%',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '14px',
                                  color: 'transparent',
                                  transition: 'all 0.15s',
                                }}
                                aria-label="Mark as logged"
                              >
                                ○
                              </button>
                            )}

                            {/* Swap button */}
                            {!isNotToday && !item.logged && (
                              isSwapping ? (
                                <div style={{
                                  width: '28px', height: '28px', minWidth: '28px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <div style={{
                                    width: '14px', height: '14px',
                                    border: '2px solid #16a34a', borderTopColor: 'transparent',
                                    borderRadius: '50%',
                                    animation: 'swap-spin 0.6s linear infinite',
                                  }} />
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleSwapItem(meal.meal_type, item.food_id)}
                                  disabled={swapRetryAfter > 0}
                                  style={{
                                    width: '52px', minHeight: '28px', padding: '0 6px',
                                    cursor: swapRetryAfter > 0 ? 'not-allowed' : 'pointer',
                                    opacity: swapRetryAfter > 0 ? 0.5 : 1,
                                    background: swapRetryAfter > 0 ? '#f3f4f6' : '#f0fdf4',
                                    border: swapRetryAfter > 0 ? '1px solid #e5e7eb' : '1px solid #bbf7d0',
                                    borderRadius: '4px',
                                    color: swapRetryAfter > 0 ? '#999' : '#16a34a',
                                    fontWeight: 'bold', fontSize: '0.8rem',
                                    whiteSpace: 'nowrap', flexShrink: 0,
                                    transition: 'background 0.15s',
                                  }}
                                >
                                  {swapRetryAfter > 0 ? formatCountdown(swapRetryAfter) : 'Swap'}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
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
          }}>&times;</button>
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