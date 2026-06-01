import { useState, useEffect, useCallback } from 'react';
import { startOfMonth } from 'date-fns';
import { useMonthData } from '../../shared/calendar/index.js';
import { getWeeklyPlan } from './api/activityCalendarApi.js';
import { getActivitySummary } from './api/activityApi.js';
import ActivityCalendarSection from './components/ActivityCalendarSection.jsx';
import ActivitySummary from './components/ActivitySummary.jsx';
import ActivityLogSection from './components/ActivityLogSection.jsx';

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState('plan');
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

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
  }, [today]);

  const handleMonthChange = useCallback((month) => {
    setCurrentMonth(month);
  }, []);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <h2>{'Activity'}</h2>

      {!summaryLoading && summary && (
        <ActivitySummary summary={summary} />
      )}

      <div style={{ display: 'flex', gap: '0', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('plan')}
          style={{
            flex: 1, padding: '0.75rem 1rem', cursor: 'pointer', minHeight: '44px',
            border: 'none', background: 'none',
            fontWeight: activeTab === 'plan' ? 700 : 400,
            color: activeTab === 'plan' ? '#16a34a' : '#666',
            borderBottom: activeTab === 'plan' ? '2px solid #16a34a' : '2px solid transparent',
            marginBottom: '-2px',
            fontSize: '1rem',
          }}
        >
          {'Plan'}
        </button>
        <button
          onClick={() => setActiveTab('log')}
          style={{
            flex: 1, padding: '0.75rem 1rem', cursor: 'pointer', minHeight: '44px',
            border: 'none', background: 'none',
            fontWeight: activeTab === 'log' ? 700 : 400,
            color: activeTab === 'log' ? '#16a34a' : '#666',
            borderBottom: activeTab === 'log' ? '2px solid #16a34a' : '2px solid transparent',
            marginBottom: '-2px',
            fontSize: '1rem',
          }}
        >
          {'Log'}
        </button>
      </div>

      {activeTab === 'plan' && (
        <ActivityCalendarSection
          dayStatusMap={dayStatusMap}
          loading={loading}
          error={error}
          onMonthChange={handleMonthChange}
        />
      )}

      {activeTab === 'log' && (
        <ActivityLogSection />
      )}
    </div>
  );
}