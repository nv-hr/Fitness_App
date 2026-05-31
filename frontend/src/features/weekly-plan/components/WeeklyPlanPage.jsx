import { useState, useEffect, useCallback } from 'react';
import { getWeeklyPlan, generateWeeklyPlan, regenerateDay, swapActivity } from '../api/weeklyPlanApi.js';
import DayCard from './DayCard.jsx';
import EmptyStatePlan from './EmptyStatePlan.jsx';
import FallbackBanner from './FallbackBanner.jsx';
import Toast from './Toast.jsx';

function getMonday(date) {
  const d = new Date(date);
  const localDay = d.getDay();
  const diff = d.getDate() - localDay + (localDay === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export default function WeeklyPlanPage() {
  const [plan, setPlan] = useState(null);
  const [status, setStatus] = useState(null);            // plan status: 'active' | 'fallback' | 'unavailable'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);    // first-time generation
  const [regeneratingDayIndex, setRegeneratingDayIndex] = useState(null);
  const [genRetryAfter, setGenRetryAfter] = useState(null);  // rate-limit for first-time generation
  const [dayRetryAfters, setDayRetryAfters] = useState({});  // { dayIndex: seconds }
  const [swappingActivityId, setSwappingActivityId] = useState(null);
  const [swapRetryAfter, setSwapRetryAfter] = useState(null);
  const [toast, setToast] = useState(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const weekStart = getMonday(new Date());

  // Load plan on mount
  const loadPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getWeeklyPlan(weekStart);
      if (res.data?.plan) {
        setPlan(res.data.plan);
        setStatus(res.data.plan.status || 'active');
      } else {
        setPlan(null);
        setStatus(null);
      }
    } catch (err) {
      setError(err.message || 'Could not load your weekly plan. Try again or check back later.');
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  // Swap countdown effect
  useEffect(() => {
    if (swapRetryAfter != null && swapRetryAfter > 0) {
      const interval = setInterval(() => {
        setSwapRetryAfter((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [swapRetryAfter]);

  // Handle first-time generation
  const handleGenerate = async (availableDays) => {
    try {
      setGenerating(true);
      setError('');
      setGenRetryAfter(null);
      const res = await generateWeeklyPlan(weekStart, availableDays);
      if (res.data?.plan) {
        setPlan(res.data.plan);
        setStatus(res.data.plan.status || 'active');
      }
    } catch (err) {
      if (err.retryAfter || err.code === 'RATE_LIMITED') {
        const retryAfter = err.retryAfter || 150;
        setGenRetryAfter(retryAfter);
      } else {
        setError(err.message || 'Failed to generate plan. Try again or check back later.');
      }
    } finally {
      setGenerating(false);
    }
  };

  // Handle single-day regeneration
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
      if (err.retryAfter || err.code === 'RATE_LIMITED') {
        const retryAfter = err.retryAfter || 150;
        setDayRetryAfters((prev) => ({ ...prev, [dayIndex]: retryAfter }));
      } else {
        setError(err.message || 'Failed to regenerate day. Try again.');
      }
    } finally {
      setRegeneratingDayIndex(null);
    }
  };

  // Handle single-activity swap
  const handleSwap = async (activityId, dayIndex) => {
    if (swapRetryAfter > 0) return;

    try {
      setSwappingActivityId(activityId);
      setError('');
      const res = await swapActivity(weekStart, activityId, dayIndex);
      if (res.data?.plan) {
        setPlan(res.data.plan);
        setStatus(res.data.plan.status || 'active');
      }
    } catch (err) {
      if (err.retryAfter || err.code === 'RATE_LIMITED') {
        const retryAfter = err.retryAfter || 300;
        setSwapRetryAfter(retryAfter);
        setToast({ message: `Swap limit reached. Please wait ${retryAfter}s before trying again.` });
      } else if (err.code === 'NOT_FOUND_ERROR' || err.code === 'REMOVED') {
        setToast({ message: 'Activity not found in current plan. It may have been removed.' });
      } else {
        setToast({ message: 'Could not swap activity. Please try again.' });
      }
    } finally {
      setSwappingActivityId(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
        {toast && <Toast message={toast.message} onDismiss={dismissToast} />}
        {'Loading...'}
      </div>
    );
  }

  // Error state (fetch fail)
  if (error && !plan && !generating) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
        {toast && <Toast message={toast.message} onDismiss={dismissToast} />}
        <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={loadPlan}
          style={{
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            background: '#fff',
            minHeight: '44px',
          }}
        >
          {'Try Again'}
        </button>
      </div>
    );
  }

  // Rate-limited state (first-time generation)
  if (genRetryAfter != null && genRetryAfter > 0 && !plan) {
    const minutes = Math.floor(genRetryAfter / 60);
    const seconds = genRetryAfter % 60;
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem', textAlign: 'center' }}>
        {toast && <Toast message={toast.message} onDismiss={dismissToast} />}
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: 700 }}>
          {'Weekly Plan'}
        </h3>
        <p style={{ color: '#666', fontSize: '0.875rem' }}>
          {'Weekly plan generation limit reached. Please wait before trying again.'}
        </p>
        <p style={{ color: '#16a34a', fontSize: '1rem', fontWeight: 'bold', marginTop: '1rem' }}>
          {'Wait'} {minutes}:{seconds.toString().padStart(2, '0')}
        </p>
      </div>
    );
  }

  // Empty state (no plan exists)
  if (!plan) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
        {toast && <Toast message={toast.message} onDismiss={dismissToast} />}
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>
          {'Weekly Activity Plan'}
        </h2>
        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
        <EmptyStatePlan onGenerate={handleGenerate} isGenerating={generating} />
      </div>
    );
  }

  // Active plan (exists — render day cards)
  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
      {toast && <Toast message={toast.message} onDismiss={dismissToast} />}

      <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
        {'Weekly Activity Plan'}
      </h2>

      {/* Freshness label */}
      {plan.generated_at && (
        <p style={{ color: '#16a34a', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {'Generated ' + Math.floor((Date.now() - new Date(plan.generated_at).getTime()) / 60000) + ' minutes ago'}
        </p>
      )}

      {/* Fallback banner */}
      <FallbackBanner status={status} />

      {/* Error message (after active plan loaded) */}
      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

      {/* Day cards */}
      {(plan.days || []).map((day, index) => (
        <DayCard
          key={day.date}
          day={day}
          dayIndex={index}
          onRegenerateDay={handleRegenerateDay}
          isRegenerating={regeneratingDayIndex === index}
          retryAfter={dayRetryAfters[index] ?? null}
          onSwapActivity={handleSwap}
          swappingActivityId={swappingActivityId}
          swapRetryAfter={swapRetryAfter}
        />
      ))}
    </div>
  );
}
