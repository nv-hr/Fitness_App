import { useState, useEffect, useCallback } from 'react';
import { getMealPlan, generateMealPlan, regenerateDay, logDay } from '../api/mealPlanApi.js';
import DayMealCard from './DayMealCard.jsx';
import EmptyStateMealPlan from './EmptyStateMealPlan.jsx';
import FallbackBanner from './FallbackBanner.jsx';

function getMonday(date) {
  const d = new Date(date);
  const localDay = d.getDay();
  const diff = d.getDate() - localDay + (localDay === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export default function MealPlanPage() {
  const [plan, setPlan] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [regeneratingDayIndex, setRegeneratingDayIndex] = useState(null);
  const [loggingDayIndex, setLoggingDayIndex] = useState(null);
  const [genRetryAfter, setGenRetryAfter] = useState(null);
  const [dayRetryAfters, setDayRetryAfters] = useState({});

  const weekStart = getMonday(new Date());
  const todayStr = new Date().toISOString().split('T')[0];

  const loadPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getMealPlan(weekStart);
      if (res.data?.plan) {
        setPlan(res.data.plan);
        setStatus(res.data.plan.status || 'active');
      } else {
        setPlan(null);
        setStatus(null);
      }
    } catch (err) {
      setError(err.message || 'Could not load your meal plan.');
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      setGenRetryAfter(null);
      const res = await generateMealPlan(weekStart);
      if (res.data?.plan) {
        setPlan(res.data.plan);
        setStatus(res.data.plan.status || 'active');
      }
    } catch (err) {
      if (err.retryAfter || err.message?.includes('RATE_LIMITED')) {
        setGenRetryAfter(err.retryAfter || 150);
      } else {
        setError(err.message || 'Failed to generate meal plan.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateDay = async (day) => {
    const dayIndex = plan?.days?.findIndex((d) => d.date === day.date);
    if (dayIndex == null || dayIndex < 0) return;
    try {
      setRegeneratingDayIndex(dayIndex);
      setError('');
      const res = await regenerateDay(weekStart, dayIndex);
      if (res.data?.plan) {
        setPlan(res.data.plan);
        setStatus(res.data.plan.status || 'active');
      }
    } catch (err) {
      if (err.retryAfter || err.message?.includes('RATE_LIMITED')) {
        setDayRetryAfters((prev) => ({ ...prev, [dayIndex]: err.retryAfter || 150 }));
      } else {
        setError(err.message || 'Failed to regenerate day.');
      }
    } finally {
      setRegeneratingDayIndex(null);
    }
  };

  const handleLogDay = async (day) => {
    const dayIndex = plan?.days?.findIndex((d) => d.date === day.date);
    if (dayIndex == null || dayIndex < 0) return;
    try {
      setLoggingDayIndex(dayIndex);
      setError('');
      const res = await logDay(weekStart, dayIndex);
      if (res.data?.logged > 0) {
        const updatedPlan = JSON.parse(JSON.stringify(plan));
        const targetDay = updatedPlan.days[dayIndex];
        if (targetDay) {
          for (const meal of targetDay.meals) {
            for (const item of meal.items) {
              item.logged = true;
            }
          }
        }
        setPlan(updatedPlan);
      }
    } catch (err) {
      setError(err.message || 'Failed to log meals.');
    } finally {
      setLoggingDayIndex(null);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
        {'Loading...'}
      </div>
    );
  }

  if (error && !plan && !generating) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
        <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
        <button onClick={loadPlan} style={{
          padding: '0.75rem 1rem', cursor: 'pointer',
          border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', minHeight: '44px',
        }}>
          {'Try Again'}
        </button>
      </div>
    );
  }

  if (genRetryAfter != null && genRetryAfter > 0 && !plan) {
    const minutes = Math.floor(genRetryAfter / 60);
    const seconds = genRetryAfter % 60;
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: 700 }}>
          {'Meal Plan'}
        </h3>
        <p style={{ color: '#666', fontSize: '0.875rem' }}>
          {'Meal plan generation limit reached. Please wait before trying again.'}
        </p>
        <p style={{ color: '#16a34a', fontSize: '1rem', fontWeight: 'bold', marginTop: '1rem' }}>
          {'Wait'} {minutes}:{seconds.toString().padStart(2, '0')}
        </p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>
          {'Weekly Meal Plan'}
        </h2>
        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
        <EmptyStateMealPlan onGenerate={handleGenerate} isGenerating={generating} />
      </div>
    );
  }

  const todayIndex = plan.days?.findIndex(d => d.date === todayStr);

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
      <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
        {'Weekly Meal Plan'}
      </h2>

      {plan.generated_at && (
        <p style={{ color: '#16a34a', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {'Generated ' + Math.floor((Date.now() - new Date(plan.generated_at).getTime()) / 60000) + ' minutes ago'}
        </p>
      )}

      <FallbackBanner status={status} />

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

      {(plan.days || []).map((day, index) => (
        <DayMealCard
          key={day.date}
          day={day}
          onRegenerateDay={handleRegenerateDay}
          onLogDay={handleLogDay}
          isRegenerating={regeneratingDayIndex === index}
          isLogging={loggingDayIndex === index}
          isDefaultOpen={todayIndex === index || index === 0}
        />
      ))}
    </div>
  );
}
