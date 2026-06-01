import { useState, useEffect, useCallback } from 'react';
import { startOfMonth } from 'date-fns';
import { getDailySummary } from '../api/foodLogApi.js';
import { useMonthMealData } from '../hooks/useMonthMealData.js';
import CalorieSummary from './CalorieSummary.jsx';
import FoodLogForm from './FoodLogForm.jsx';
import MealCalendarSection from './MealCalendarSection.jsx';

export default function FoodLogPage() {
  const [activeTab, setActiveTab] = useState('plan');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const { dayStatusMap, loading, error } = useMonthMealData(currentMonth);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadSummary() {
      try {
        setSummaryLoading(true);
        const res = await getDailySummary(today);
        setSummary(res.data);
      } catch {
        // Silently fail
      } finally {
        setSummaryLoading(false);
      }
    }
    loadSummary();
  }, [today]);

  const handleDaySelect = useCallback((day) => {
    setSelectedDate(day);
  }, []);

  const handleMonthChange = useCallback((month) => {
    setCurrentMonth(month);
  }, []);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <h2>{'Log Food'}</h2>

      {!summaryLoading && summary && (
        <CalorieSummary
          totalConsumed={summary.totalConsumed}
          calorieTarget={summary.calorieTarget}
          remaining={summary.remaining}
          isExtremeDeficit={summary.isExtremeDeficit}
        />
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
        <MealCalendarSection
          dayStatusMap={dayStatusMap}
          loading={loading}
          error={error}
          onDaySelect={handleDaySelect}
          onMonthChange={handleMonthChange}
        />
      )}

      {activeTab === 'log' && (
        <FoodLogForm />
      )}
    </div>
  );
}