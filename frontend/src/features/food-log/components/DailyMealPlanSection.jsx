import { useState, useEffect, useRef, useCallback } from 'react';
import { getDailyMealPlan, generateDailyMealPlan, logMeals } from '../api/dailyMealPlanApi.js';

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function DailyMealPlanSection() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [genRetryAfter, setGenRetryAfter] = useState(null);
  const [loggingMeal, setLoggingMeal] = useState(null);
  const autoGenGuard = useRef(false);
  const today = getTodayString();

  const loadPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getDailyMealPlan(today);
      if (res.data?.plan) {
        setPlan(res.data.plan);
      } else {
        setPlan(null);
      }
    } catch (err) {
      setError(err.message || 'Could not load meal plan.');
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
      const res = await generateDailyMealPlan(today);
      if (res.data?.plan) {
        setPlan(res.data.plan);
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

  const handleLogMeal = async (mealType) => {
    try {
      setLoggingMeal(mealType);
      setError('');
      const res = await logMeals(today, [mealType]);
      if (res.data?.logged > 0 && plan) {
        const updated = JSON.parse(JSON.stringify(plan));
        const meal = updated.meals?.find(m => m.meal_type === mealType);
        if (meal && Array.isArray(meal.items)) {
          meal.items.forEach(item => { item.logged = true; });
        }
        setPlan(updated);
      }
    } catch (err) {
      setError(err.message || 'Failed to log meal.');
    } finally {
      setLoggingMeal(null);
    }
  };

  if (loading && !plan) {
    return <p style={{ color: '#666', fontSize: '0.875rem', padding: '0.5rem 0' }}>Loading meal plan...</p>;
  }

  if (genRetryAfter != null && genRetryAfter > 0 && !plan) {
    const minutes = Math.floor(genRetryAfter / 60);
    const seconds = genRetryAfter % 60;
    return (
      <div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 700 }}>Today's Meal Plan</h3>
        <p style={{ color: '#666', fontSize: '0.875rem' }}>Meal plan generation limit reached. Please wait.</p>
        <p style={{ color: '#16a34a', fontWeight: 'bold', marginTop: '0.5rem' }}>Wait {minutes}:{seconds.toString().padStart(2, '0')}</p>
      </div>
    );
  }

  if (!plan || !plan.meals || plan.meals.length === 0) {
    return (
      <div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 700 }}>Today's Meal Plan</h3>
        {error && <p style={{ color: 'red', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{error}</p>}
        <p style={{ color: '#666', marginBottom: '0.5rem', fontSize: '0.875rem' }}>No meal plan for today.</p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', minHeight: '44px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff' }}
        >
          {generating ? 'Generating...' : 'Generate Meal Plan'}
        </button>
      </div>
    );
  }

  const sortedMeals = [...plan.meals].sort((a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Today's Meal Plan</h3>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{ padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', minHeight: '44px' }}
        >
          {generating ? '...' : 'Regenerate'}
        </button>
      </div>
      {error && <p style={{ color: 'red', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{error}</p>}
      {plan.generated_at && (
        <p style={{ color: '#16a34a', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          Generated {Math.floor((Date.now() - new Date(plan.generated_at).getTime()) / 60000)} min ago
        </p>
      )}
      {plan.total_calories > 0 && (
        <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          Total: ~{plan.total_calories} kcal
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {sortedMeals.map((meal) => {
          const allLogged = meal.items?.every(item => item.logged);
          return (
            <div key={meal.meal_type} style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <strong style={{ textTransform: 'capitalize' }}>{meal.meal_type}</strong>
                <div>
                  {meal.total_calories > 0 && (
                    <span style={{ color: '#666', fontSize: '0.8rem', marginRight: '0.5rem' }}>{meal.total_calories} kcal</span>
                  )}
                  {allLogged ? (
                    <span style={{ color: '#16a34a', fontSize: '0.8rem' }}>Logged ✓</span>
                  ) : (
                    <button
                      onClick={() => handleLogMeal(meal.meal_type)}
                      disabled={loggingMeal === meal.meal_type}
                      style={{ padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', minHeight: '44px' }}
                    >
                      {loggingMeal === meal.meal_type ? '...' : 'Log'}
                    </button>
                  )}
                </div>
              </div>
              {meal.items && meal.items.length > 0 && (
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  {meal.items.map((item, i) => (
                    <span key={i}>
                      {i > 0 && ', '}
                      {item.food_name} ({item.portion_grams}g{item.calories ? `, ${item.calories} cal` : ''}){item.logged ? ' ✓' : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
