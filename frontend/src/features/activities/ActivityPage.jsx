import { useState, useEffect, useCallback } from 'react';
import { startOfMonth } from 'date-fns';
import { useMonthData } from '../../shared/calendar/index.js';
import { getWeeklyPlan } from './api/activityCalendarApi.js';
import { getActivitySummary } from './api/activityApi.js';
import ActivityCalendarSection from './components/ActivityCalendarSection.jsx';
import ActivitySummary from './components/ActivitySummary.jsx';
import ActivityLogSection from './components/ActivityLogSection.jsx';
import { Calendar, Dumbbell, Loader2 } from 'lucide-react';

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState('log');
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchWeekFn = useCallback(async (weekStart) => {
    const res = await getWeeklyPlan(weekStart);
    return res.data;
  }, []);

  const { dayStatusMap, loading, error } = useMonthData(currentMonth, fetchWeekFn);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadSummary() {
      try {
        setSummaryLoading(true);
        const res = await getActivitySummary(today);
        setSummary(res.data);
      } catch {
        // Silently fail
      } finally {
        setSummaryLoading(false);
      }
    }
    loadSummary();
  }, [today, refreshTrigger]);

  useEffect(() => {
    const handleUpdate = () => {
      setRefreshTrigger((prev) => prev + 1);
    };
    window.addEventListener('health-system-update', handleUpdate);
    return () => {
      window.removeEventListener('health-system-update', handleUpdate);
    };
  }, []);

  const handleMonthChange = useCallback((month) => {
    setCurrentMonth(month);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-slate-800 tracking-tight">
            Activity Tracker & Workout Recommendations
          </h1>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed">
            Get smart AI daily workout recommendations or log your own exercises.
          </p>
        </div>
      </div>

      {/* Embedded Executive Summary Card */}
      {!summaryLoading && summary ? (
        <ActivitySummary summary={summary} />
      ) : (
        <div className="h-28 bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 text-xs">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Connecting daily calorie burn logs...
        </div>
      )}

      {/* Tab bar switches */}
      <div className="bg-slate-100/80 backdrop-blur-xs p-1 rounded-2xl flex max-w-md border border-slate-200/20">
        <button
          onClick={() => setActiveTab('log')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'log'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          Log Workouts
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'plan'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Weekly AI Plan
        </button>
      </div>

      {/* Renders corresponding panel items */}
      {activeTab === 'plan' && (
        <ActivityCalendarSection
          dayStatusMap={dayStatusMap}
          loading={loading}
          error={error}
          onMonthChange={handleMonthChange}
        />
      )}

      {activeTab === 'log' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/50 shadow-lux">
          <h2 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
            Log New Workout
          </h2>
          <ActivityLogSection />
        </div>
      )}
    </div>
  );
}
