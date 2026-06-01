import { useState, useEffect, useCallback } from 'react';
import { format, isBefore, isToday, startOfToday, startOfWeek, startOfMonth } from 'date-fns';
import DayActivityRow from './DayActivityRow.jsx';
import { useResponsive } from '../../../shared/hooks/useResponsive.js';
import {
  getWeeklyPlan,
  generateWeeklyPlan,
  swapActivity,
  toggleActivityComplete,
  regenerateDay,
} from '../api/activityCalendarApi.js';
import { 
  Sparkles, 
  RotateCw, 
  Clock, 
  AlertCircle, 
  Info, 
  X,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ActivityCalendarSection({
  onDaySelect: externalOnDaySelect,
  onMonthChange: externalOnMonthChange,
  dayStatusMap,
  loading,
  error
}) {
  const [selectedDay, setSelectedDay] = useState(() => startOfToday());
  const [dayPlan, setDayPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genRetryAfter, setGenRetryAfter] = useState(null);
  const [swappingActivityId, setSwappingActivityId] = useState(null);
  const [swapRetryAfter, setSwapRetryAfter] = useState(null);
  const [toast, setToast] = useState(null);
  const [completedActivities, setCompletedActivities] = useState(() => new Set());
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

  // Sync parent's currentMonth so that monthly state remains aligned
  useEffect(() => {
    if (selectedDay && externalOnMonthChange) {
      externalOnMonthChange(startOfMonth(selectedDay));
    }
  }, [selectedDay, externalOnMonthChange]);

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

  // Dynamic automatic background workout generation for today if workout plan is missing
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
            const found = plan.days.find(d => d.date === todayStr);
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
  }, [selectedDay, planLoading, dayPlan, generating, genRetryAfter]);

  const handleGenerateWeek = useCallback(async () => {
    try {
      setGenerating(true);
      setGenRetryAfter(null);
      const targetDay = selectedDay || new Date();
      const weekStart = format(startOfWeek(targetDay, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      
      // Force whole week regeneration by calling regenerateDay for index 0, which clears cached entries
      // and triggers the LLM on the backend to construct a completely fresh 7-day physical activities plan.
      const resRegen = await regenerateDay(weekStart, 0, 4);
      const plan = resRegen.data?.plan;
      
      if (plan && Array.isArray(plan.days)) {
        // Silent database sync using double-toggle on today's day (which satisfies backend today limit check)
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayIdx = plan.days.findIndex(d => d.date === todayStr);
        const todayDay = todayIdx !== -1 ? plan.days[todayIdx] : null;
        
        if (todayDay && Array.isArray(todayDay.activities) && todayDay.activities.length > 0) {
          const firstAct = todayDay.activities[0];
          try {
            await toggleActivityComplete(weekStart, todayIdx, firstAct.activity_id, !firstAct.completed);
            await toggleActivityComplete(weekStart, todayIdx, firstAct.activity_id, !!firstAct.completed);
          } catch (e) {
            console.warn('Silent database sync toggle failed:', e);
          }
        }
        
        // Sync parent/local state with the newly created elements
        if (selectedDay) {
          const dateStr = format(selectedDay, 'yyyy-MM-dd');
          const found = plan.days.find(d => d.date === dateStr);
          if (found) {
            setDayPlan(found);
            
            if (found.activities) {
              const completed = new Set();
              found.activities.forEach((act) => {
                if (act.completed) completed.add(act.activity_id);
              });
              setCompletedActivities(completed);
            }
          }
        }
      }
      window.dispatchEvent(new CustomEvent('health-system-update'));
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
  }, [selectedDay, swapRetryAfter]);

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

  const handleToggleComplete = useCallback(async (activityId, dayIndex, currentCompleted) => {
    if (!selectedDay) return;

    const weekStart = format(startOfWeek(selectedDay, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const newCompleted = !currentCompleted;

    setCompletedActivities(prev => {
      const next = new Set(prev);
      if (newCompleted) {
        next.add(activityId);
      } else {
        next.delete(activityId);
      }
      return next;
    });

    try {
      await toggleActivityComplete(weekStart, dayIndex, activityId, newCompleted);
      window.dispatchEvent(new CustomEvent('health-system-update'));
    } catch (err) {
      setCompletedActivities(prev => {
        const next = new Set(prev);
        if (!newCompleted) {
          next.add(activityId);
        } else {
          next.delete(activityId);
        }
        return next;
      });
      setToast({ message: err.message || 'Failed to update activity completion status' });
    }
  }, [selectedDay]);

  const isNotToday = selectedDay ? !isToday(selectedDay) : true;

  const renderDayContent = () => {
    if (planLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2">
          <RotateCw className="w-6 h-6 animate-spin text-emerald-500" />
          <p className="text-xs font-semibold">Downloading daily healthy activity plan...</p>
        </div>
      );
    }

    if (dayPlan?.activities?.length > 0) {
      return (
        <div className="space-y-1 animate-fade-in">
          {dayPlan.activities.map((activity) => (
            <DayActivityRow
              key={activity.activity_id}
              activity={activity}
              onSwap={isNotToday ? undefined : () => handleSwap(activity.activity_id, ((selectedDay.getDay() + 6) % 7))}
              onToggle={isNotToday ? undefined : () => handleToggleComplete(
                activity.activity_id,
                ((selectedDay.getDay() + 6) % 7),
                completedActivities.has(activity.activity_id)
              )}
              disabled={isNotToday}
              completed={completedActivities.has(activity.activity_id)}
              isSwapping={swappingActivityId === activity.activity_id}
              swapRetryAfter={swapRetryAfter}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200/80 bg-slate-50 text-slate-400">
        <Info className="w-8 h-8 text-slate-350 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-500">
          {dayPlan?.rest_day
            ? 'Rest Day — Your muscles need recovery today.'
            : 'No workouts scheduled for this date.'}
        </p>
        <p className="text-xs mt-1 max-w-xs mx-auto">Click the &ldquo;Recreate Weekly Plan&rdquo; button above to generate workout targets.</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert message panel */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-white border border-rose-100 p-4 rounded-xl shadow-elevated text-sm text-slate-850 max-w-sm animate-slide-in">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="font-semibold text-xs leading-relaxed flex-1">{toast.message}</p>
          <button 
            onClick={() => setToast(null)} 
            className="p-1 text-slate-350 hover:text-slate-655 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Rencana Workout Generator Box */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-5 rounded-2xl text-white border border-emerald-500/15 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-base flex items-center gap-1.5 leading-none">
            <Sparkles className="w-5 h-5 animate-pulse text-yellow-300" />
            KalaFit AI Workout Assistant
          </h3>
          <p className="text-xs text-white/80 mt-1 max-w-md leading-relaxed">
            Formulate or recreate custom fitness targets. The adaptive plan will automatically customize your biologic exercise intensities.
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
              onClick={handleGenerateWeek}
              disabled={generating}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 font-bold text-xs rounded-xl shadow-sm transition-transform active:scale-95 cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed font-sans"
            >
              {generating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" /> Designing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Recreate Weekly Plan
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
              Active Workout Date
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

      {/* Main Workout Content Cards list */}
      <div className="bg-white p-4.5 sm:p-6 rounded-2xl border border-slate-200/50 shadow-lux">
        <h3 className="font-display font-bold text-base text-slate-800 mb-4 flex items-center gap-1.5">
          <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
          Workout Details ({format(selectedDay, 'dd MMMM yyyy')})
        </h3>
        {renderDayContent()}
      </div>
    </div>
  );
}
