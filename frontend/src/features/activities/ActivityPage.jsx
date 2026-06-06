import { useState, useEffect, useCallback } from 'react';
import { startOfMonth, format } from 'date-fns';
import { useMonthData } from '../../shared/calendar/index.js';
import { getWeeklyPlan } from './api/activityCalendarApi.js';
import { getActivitySummary } from './api/activityApi.js';
import ActivityCalendarSection from './components/ActivityCalendarSection.jsx';
import ActivitySummary from './components/ActivitySummary.jsx';
import ActivityLogSection from './components/ActivityLogSection.jsx';
import { Calendar, Dumbbell, Loader2 } from 'lucide-react';

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState('plan');
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchWeekFn = useCallback(async (weekStart) => {
    const res = await getWeeklyPlan(weekStart);
    return res.data;
  }, []);

  const { dayStatusMap, loading, error } = useMonthData(currentMonth, fetchWeekFn);

  const today = format(new Date(), 'yyyy-MM-dd');

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
          <h1 className="font-display font-extrabold text-3xl tracking-tight" style={{ color: '#fff' }}>
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
        <div className="h-28 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl animate-pulse flex items-center justify-center text-slate-400 text-xs">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Connecting daily calorie burn logs...
        </div>
      )}

      {/* Tab bar switches */}
      <div style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }} className="p-1 rounded-2xl flex max-w-md">
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'plan'
              ? 'bg-[#2d2d2d] text-emerald-400 shadow-sm'
              : 'text-[#555] hover:text-[#aaa]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Weekly AI Plan
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'log'
              ? 'bg-[#2d2d2d] text-emerald-400 shadow-sm'
              : 'text-[#555] hover:text-[#aaa]'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          Log Workouts
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
        <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl border border-[#2a2a2a] shadow-lux">
          <h2 className="font-display font-bold text-lg text-white border-b border-[#2a2a2a] pb-3 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
            Log New Workout
          </h2>
          <ActivityLogSection />
        </div>
      )}
    </div>
  );
}
