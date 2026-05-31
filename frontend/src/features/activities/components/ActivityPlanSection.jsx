import { useState, useEffect, useRef, useCallback } from 'react';
import { getActivityPlan, generateActivityPlan, logActivities } from '../api/activityPlanApi.js';

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

export default function ActivityPlanSection() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [genRetryAfter, setGenRetryAfter] = useState(null);
  const [logging, setLogging] = useState(false);
  const autoGenGuard = useRef(false);
  const today = getTodayString();

  const loadPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getActivityPlan(today);
      if (res.data?.plan) {
        setPlan(res.data.plan);
      } else {
        setPlan(null);
      }
    } catch (err) {
      setError(err.message || 'Could not load activity plan.');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  useEffect(() => {
    if (!loading && !plan && !generating && !autoGenGuard.current) {
      autoGenGuard.current = true;
      handleGenerate();
    }
  }, [loading, plan]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      setGenRetryAfter(null);
      const res = await generateActivityPlan(today);
      if (res.data?.plan) {
        setPlan(res.data.plan);
      }
    } catch (err) {
      if (err.retryAfter || err.message?.includes('RATE_LIMITED')) {
        setGenRetryAfter(err.retryAfter || 150);
      } else {
        setError(err.message || 'Failed to generate activity plan.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleLogActivity = async (index) => {
    try {
      setLogging(true);
      setError('');
      const res = await logActivities(today, [index]);
      if (res.data?.logged > 0 && plan) {
        const updated = JSON.parse(JSON.stringify(plan));
        if (updated.activities[index]) {
          updated.activities[index].logged = true;
        }
        setPlan(updated);
      }
    } catch (err) {
      setError(err.message || 'Failed to log activity.');
    } finally {
      setLogging(false);
    }
  };

  if (loading && !plan) {
    return <p style={{ color: '#666', fontSize: '0.875rem', padding: '0.5rem 0' }}>Loading activity plan...</p>;
  }

  if (genRetryAfter != null && genRetryAfter > 0 && !plan) {
    const minutes = Math.floor(genRetryAfter / 60);
    const seconds = genRetryAfter % 60;
    return (
      <div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 700 }}>Today's Activity Plan</h3>
        <p style={{ color: '#666', fontSize: '0.875rem' }}>Activity plan generation limit reached. Please wait.</p>
        <p style={{ color: '#16a34a', fontWeight: 'bold', marginTop: '0.5rem' }}>Wait {minutes}:{seconds.toString().padStart(2, '0')}</p>
      </div>
    );
  }

  if (!plan || !plan.activities || plan.activities.length === 0) {
    return (
      <div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 700 }}>Today's Activity Plan</h3>
        {error && <p style={{ color: 'red', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{error}</p>}
        <p style={{ color: '#666', marginBottom: '0.5rem', fontSize: '0.875rem' }}>No plan for today.</p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', minHeight: '44px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff' }}
        >
          {generating ? 'Generating...' : 'Generate Activity Plan'}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.25rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Today's Activity Plan</h3>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{ padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', minHeight: '44px' }}
          >
            {generating ? '...' : 'Regenerate'}
          </button>
        </div>
      </div>
      {error && <p style={{ color: 'red', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{error}</p>}
      {plan.generated_at && (
        <p style={{ color: '#16a34a', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          Generated {Math.floor((Date.now() - new Date(plan.generated_at).getTime()) / 60000)} min ago
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {plan.activities.map((act, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px', background: act.logged ? '#f0fdf4' : '#fff' }}>
            <div>
              <strong>{act.name}</strong>
              <span style={{ color: '#666', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{act.duration_min}min {act.intensity}</span>
              {act.calories_burned > 0 && <span style={{ color: '#666', fontSize: '0.8rem', marginLeft: '0.5rem' }}>~{act.calories_burned} cal</span>}
            </div>
            {act.logged ? (
              <span style={{ color: '#16a34a', fontSize: '0.8rem' }}>Logged ✓</span>
            ) : (
              <button
                onClick={() => handleLogActivity(i)}
                disabled={logging}
                style={{ padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', minHeight: '44px' }}
              >
                {logging ? '...' : 'Log'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
