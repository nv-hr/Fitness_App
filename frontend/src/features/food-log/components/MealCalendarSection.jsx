import { useState, useEffect, useCallback } from 'react';
import { format, startOfToday } from 'date-fns';
import { getDailyMealPlan, generateDailyMealPlan, logMeals, toggleItemLogged, regenerateCategory } from '../api/dailyMealPlanApi.js';
import { useResponsive } from '../../../shared/hooks/useResponsive.js';
import { 
  Sparkles, 
  RotateCw, 
  CheckCircle2, 
  Flame, 
  Clock, 
  X, 
  Coffee, 
  Utensils, 
  Moon, 
  Cookie,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const MEAL_META = {
  breakfast: { label: 'Breakfast', color: 'text-amber-500 bg-amber-50 border-amber-100', icon: Coffee },
  lunch: { label: 'Lunch', color: 'text-emerald-500 bg-emerald-50 border-emerald-100', icon: Utensils },
  dinner: { label: 'Dinner', color: 'text-indigo-500 bg-indigo-50 border-indigo-100', icon: Moon },
  snack: { label: 'Snack', color: 'text-rose-500 bg-rose-50 border-rose-100', icon: Cookie },
};

export default function MealCalendarSection({
  onDaySelect: externalOnDaySelect,
}) {
  const [selectedDay, setSelectedDay] = useState(() => startOfToday());
  const [dayPlan, setDayPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [genRetryAfter, setGenRetryAfter] = useState(null);
  const [loggingMeal, setLoggingMeal] = useState(null);
  const [regeneratingCategory, setRegeneratingCategory] = useState(null);
  const [swapRetryAfter, setSwapRetryAfter] = useState(null);
  const [toast, setToast] = useState(null);
  const { isMobile } = useResponsive();

  const handlePrevDay = useCallback(() => {
    setSelectedDay(prev => {
      const prevDate = new Date(prev);
      prevDate.setDate(prevDate.getDate() - 1);
      if (externalOnDaySelect) externalOnDaySelect(prevDate);
      return prevDate;
    });
  }, [externalOnDaySelect]);

  const handleNextDay = useCallback(() => {
    setSelectedDay(prev => {
      const nextDate = new Date(prev);
      nextDate.setDate(nextDate.getDate() + 1);
      if (externalOnDaySelect) externalOnDaySelect(nextDate);
      return nextDate;
    });
  }, [externalOnDaySelect]);

  const handleGoToToday = useCallback(() => {
    const today = startOfToday();
    setSelectedDay(today);
    if (externalOnDaySelect) externalOnDaySelect(today);
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

  // Dynamic automatic background meal generation for today if meal plan is missing
  useEffect(() => {
    if (!selectedDay) return;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const selStr = format(selectedDay, 'yyyy-MM-dd');

    if (selStr === todayStr && !planLoading && !dayPlan && !generating && genRetryAfter === null) {
      (async () => {
        setGenerating(true);
        try {
          const res = await generateDailyMealPlan(todayStr);
          if (res.data?.plan) {
            setDayPlan(res.data.plan);
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
  }, [selectedDay, planLoading, dayPlan, generating, genRetryAfter]);

  const handleGenerateDay = useCallback(async () => {
    try {
      setGenerating(true);
      setGeneratingStatus('Preparing...');
      setGenRetryAfter(null);
      
      // Auto-switch to today to bypass backend checks and enable logging/toggles
      const today = startOfToday();
      setSelectedDay(today);
      const dateStr = format(today, 'yyyy-MM-dd');

      // Pre-fetch today's active plan so that we have the correct items to double-toggle
      let activeTodayPlan = null;
      try {
        const res0 = await getDailyMealPlan(dateStr);
        activeTodayPlan = res0.data?.plan || null;
      } catch (e) {
        console.warn('Failed to pre-fetch today\'s plan:', e);
      }

      // If we don't have an existing plan yet, just generate a new plan directly
      if (!activeTodayPlan || !activeTodayPlan.meals || activeTodayPlan.meals.length === 0) {
        setGeneratingStatus('Formulating...');
        const res = await generateDailyMealPlan(dateStr);
        if (res.data?.plan) {
          setDayPlan(res.data.plan);
        }
      } else {
        // If template/database already has a plan, /generate always returns existing.
        // So we recreate it statefully by regenerating each meal category sequentially with cache-busting double-toggles.
        const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        let updatedPlan = activeTodayPlan;

        for (const mealType of mealTypes) {
          setGeneratingStatus(`Recreating ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}...`);
          
          if (updatedPlan && updatedPlan.meals && updatedPlan.meals.length > 0) {
            const mealWithItems = updatedPlan.meals.find(m => m.items && m.items.length > 0);
            if (mealWithItems && mealWithItems.items.length > 0) {
              const firstItem = mealWithItems.items[0];
              try {
                await toggleItemLogged(dateStr, mealWithItems.meal_type, firstItem.food_id, !firstItem.logged);
                await toggleItemLogged(dateStr, mealWithItems.meal_type, firstItem.food_id, !!firstItem.logged);
              } catch (e) {
                console.warn('Cache clear toggle failed during full recreation:', e);
              }
            }
          }

          const res = await regenerateCategory(dateStr, mealType);
          if (res.data?.plan) {
            updatedPlan = res.data.plan;
            setDayPlan(updatedPlan);
          }
        }
      }
      window.dispatchEvent(new CustomEvent('health-system-update'));
    } catch (err) {
      if (err.retryAfter || err.code === 'RATE_LIMITED') {
        setGenRetryAfter(err.retryAfter || 150);
      } else {
        setToast({ message: err.message || 'Failed to generate meal plan' });
      }
    } finally {
      setGenerating(false);
      setGeneratingStatus('');
    }
  }, []);

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
      window.dispatchEvent(new CustomEvent('health-system-update'));
    } catch (err) {
      setToast({ message: err.message || 'Failed to record meals' });
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
      window.dispatchEvent(new CustomEvent('health-system-update'));
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
      setToast({ message: err.message || 'Failed to update record status' });
    }
  }, [selectedDay]);

  const handleRegenerateCategory = useCallback(async (mealType) => {
    if (swapRetryAfter > 0) return;
    if (!selectedDay) return;

    const dateStr = format(selectedDay, 'yyyy-MM-dd');

    try {
      setRegeneratingCategory(mealType);

      // Cache clearing: toggle and toggle back first item in current plan
      if (dayPlan && dayPlan.meals && dayPlan.meals.length > 0) {
        const mealWithItems = dayPlan.meals.find(m => m.items && m.items.length > 0);
        if (mealWithItems && mealWithItems.items.length > 0) {
          const firstItem = mealWithItems.items[0];
          try {
            await toggleItemLogged(dateStr, mealWithItems.meal_type, firstItem.food_id, !firstItem.logged);
            await toggleItemLogged(dateStr, mealWithItems.meal_type, firstItem.food_id, !!firstItem.logged);
          } catch (e) {
            console.warn('Cache clear toggle failed:', e);
          }
        }
      }

      const res = await regenerateCategory(dateStr, mealType);
      if (res.data?.plan) {
        setDayPlan(res.data.plan);
      }
      window.dispatchEvent(new CustomEvent('health-system-update'));
    } catch (err) {
      if (err.retryAfter || err.code === 'RATE_LIMITED') {
        setSwapRetryAfter(err.retryAfter || 300);
        setToast({ message: `AI regeneration limit reached. Please wait ${err.retryAfter || 300} seconds.` });
      } else {
        setToast({ message: err.message || 'Unable to regenerate meal category.' });
      }
    } finally {
      setRegeneratingCategory(null);
    }
  }, [selectedDay, swapRetryAfter, dayPlan]);

  let isNotToday = true;
  if (selectedDay) {
    const today = startOfToday();
    const sel = new Date(selectedDay);
    sel.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    isNotToday = sel.getTime() !== today.getTime();
  }

  const renderDayContent = () => {
    if (planLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
          <p className="text-xs font-semibold">Downloading daily healthy meal plan...</p>
        </div>
      );
    }

    if (!dayPlan || !dayPlan.meals || dayPlan.meals.length === 0) {
      return (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200/80 bg-slate-50 text-slate-400">
          <AlertCircle className="w-8 h-8 text-slate-350 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-500">Meal plan is empty</p>
          <p className="text-xs mt-1 max-w-xs mx-auto">Click the &ldquo;Generate Daily Menu&rdquo; button above to design your daily healthy menu plan.</p>
        </div>
      );
    }

    const sortedMeals = [...dayPlan.meals].sort(
      (a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type)
    );

    return (
      <div className="space-y-4 pt-1 animate-fade-in">
        {dayPlan.total_calories > 0 && (
          <div className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Nutritional Plan Content</span>
            <span className="text-xs font-bold text-emerald-600 font-mono bg-emerald-50/50 px-2 py-0.5 rounded-md">
              ~{dayPlan.total_calories} kcal daily
            </span>
          </div>
        )}

        <div className="space-y-4">
          {sortedMeals.map((meal) => {
            const allLogged = meal.items?.every(item => item.logged);
            const meta = MEAL_META[meal.meal_type] || {
              label: meal.meal_type,
              color: 'text-slate-650 bg-slate-50 border-slate-100',
              icon: Utensils
            };
            const MealIcon = meta.icon;

            return (
              <div 
                key={meal.meal_type} 
                className={`bg-white rounded-xl border p-4.5 transition-all duration-200 shadow-ux ${
                  isNotToday ? 'opacity-70' : allLogged ? 'opacity-65 bg-slate-50/60' : 'hover:border-emerald-200'
                }`}
              >
                {/* Header Meal Type */}
                <div className="flex justify-between items-center border-b border-slate-50 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border ${meta.color}`}>
                      <MealIcon className="w-4 h-4" />
                    </div>
                    <span className="font-display font-bold text-sm tracking-tight text-slate-800 capitalize">
                      {meta.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {meal.total_calories > 0 && (
                      <span className="text-xs font-bold text-slate-500 font-mono">
                        {meal.total_calories} kcal
                      </span>
                    )}

                    {/* Regenerate Category button in header */}
                    {!isNotToday && (
                      regeneratingCategory === meal.meal_type ? (
                        <div className="h-8 px-3 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <RotateCw className="w-4 h-4 animate-spin" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRegenerateCategory(meal.meal_type)}
                          disabled={swapRetryAfter > 0}
                          className={`h-8 px-3 rounded-lg flex items-center gap-1.5 transition-all ${
                            swapRetryAfter > 0 
                              ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100/60 cursor-pointer active:scale-95 font-bold text-xs'
                          }`}
                        >
                          {swapRetryAfter > 0 ? (
                            <span className="flex items-center gap-0.5 text-[10px] font-mono">
                              <Clock className="w-3 h-3" /> {formatCountdown(swapRetryAfter)}
                            </span>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" /> Regenerate
                            </>
                          )}
                        </button>
                      )
                    )}

                    {allLogged ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-md border border-emerald-100">
                        Done ✓
                      </span>
                    ) : isNotToday ? (
                      <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">Unlogged</span>
                    ) : (
                      <button
                        onClick={() => handleLogMeal(meal.meal_type)}
                        disabled={loggingMeal === meal.meal_type}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer min-h-[32px] disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                      >
                        {loggingMeal === meal.meal_type ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : 'Log All'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Meal list item rows */}
                {meal.items && meal.items.length > 0 && (
                  <div className="space-y-3">
                    {meal.items.map((item, i) => {
                      return (
                        <div 
                          key={i} 
                          className="flex justify-between items-center py-2.5 px-3 rounded-lg border border-transparent hover:border-slate-100 bg-slate-50/30 hover:bg-slate-50/70 transition-all"
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs sm:text-sm font-semibold text-slate-700 leading-tight block">
                              {item.food_name}
                            </span>
                            <span className="text-[11px] text-slate-405 font-medium font-mono text-slate-400">
                              {item.portion_grams}g {item.calories ? `• ~${item.calories} kcal` : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                             {/* Check action item toggle button */}
                            {item.logged ? (
                              <button
                                onClick={() => handleToggleItem(meal.meal_type, item.food_id, item.logged)}
                                className="h-8 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5 justify-center border border-emerald-600 shadow-sm transition-all cursor-pointer font-sans font-bold text-xs"
                                title="Click to mark unconsumed"
                              >
                                <CheckCircle2 className="w-4 h-4 text-white" />
                                <span>Logged</span>
                              </button>
                            ) : isNotToday ? null : (
                              <button
                                onClick={() => handleToggleItem(meal.meal_type, item.food_id, item.logged)}
                                className="h-8 px-2.5 rounded-xl border border-slate-350 hover:border-emerald-500 bg-white hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 flex items-center gap-1.5 justify-center transition-all cursor-pointer shadow-xs font-sans font-bold text-xs"
                                aria-label="Mark as consumed"
                                title="Click to mark consumed"
                              >
                                <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-white inline-block"></span>
                                <span>Unlogged</span>
                              </button>
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
    <div className="space-y-6">
      {/* Toast Alert message panel */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-white border border-rose-100 p-4 rounded-xl shadow-elevated text-sm text-slate-800 max-w-sm animate-slide-in">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="font-semibold text-xs leading-relaxed flex-1">{toast.message}</p>
          <button 
            onClick={() => setToast(null)} 
            className="p-1 text-slate-350 hover:text-slate-650 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Rencana Meal Generator Box */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-5 rounded-2xl text-white border border-emerald-500/15 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-base flex items-center gap-1.5 leading-none">
            <Sparkles className="w-5 h-5 animate-pulse text-yellow-300" />
            KalaFit AI Nutrition Assistant
          </h3>
          <p className="text-xs text-white/80 mt-1 max-w-md leading-relaxed">
            Formulate or recreate custom daily meal plans synchronized with your biological deficit or surplus target.
          </p>
        </div>

        <div className="sm:flex-shrink-0">
          {genRetryAfter != null && genRetryAfter > 0 ? (
            <button 
              disabled 
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/20 border border-white/10 text-white/80 font-bold text-xs rounded-xl cursor-not-allowed font-sans"
            >
              <Clock className="w-4 h-4" /> Wait {formatCountdown(genRetryAfter)}
            </button>
          ) : (
            <button
              onClick={handleGenerateDay}
              disabled={generating}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 font-bold text-xs rounded-xl shadow-sm transition-transform active:scale-95 cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed font-sans"
            >
              {generating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" /> {generatingStatus || 'Formulating...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Recreate Today's Menu
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Date Switcher Widget */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Active Meal Plan Date
            </span>
            <span className="font-display font-extrabold text-slate-800 text-base flex items-center gap-2">
              {format(selectedDay, 'EEEE, d MMMM yyyy')}
              {format(selectedDay, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-normal">
                  Today
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-655 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Previous Day"
          >
            <ChevronLeft className="w-4.5 h-4.5 text-slate-600" />
          </button>

          <button
            onClick={handleGoToToday}
            disabled={format(selectedDay, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 text-emerald-700 disabled:text-slate-400 font-bold text-xs rounded-xl border border-emerald-100/40 disabled:border-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed min-h-[40px]"
          >
            Back to Today
          </button>

          <button
            onClick={handleNextDay}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-655 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Next Day"
          >
            <ChevronRight className="w-4.5 h-4.5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Main Meal Content Cards list */}
      <div className="bg-white p-4.5 sm:p-6 rounded-2xl border border-slate-200/50 shadow-lux">
        <h3 className="font-display font-bold text-base text-slate-800 mb-4 flex items-center gap-1.5">
          <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
          Menu Details ({format(selectedDay, 'dd MMMM yyyy')})
        </h3>
        {renderDayContent()}
      </div>
    </div>
  );
}
