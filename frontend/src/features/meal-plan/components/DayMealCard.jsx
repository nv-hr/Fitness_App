import { useState, useMemo } from 'react';
import MealRow from './MealRow.jsx';

function formatDayHeader(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function DayMealCard({ day, onRegenerateDay, onLogDay, isRegenerating, isLogging, isDefaultOpen }) {
  const [isExpanded, setIsExpanded] = useState(isDefaultOpen || false);

  const totalCalories = useMemo(() => {
    return (day.meals || []).reduce((sum, m) => sum + (m.total_calories || 0), 0);
  }, [day.meals]);

  const isToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return day.date === today;
  }, [day.date]);

  const allLogged = useMemo(() => {
    return (day.meals || []).every(m => (m.items || []).every(i => i.logged));
  }, [day.meals]);

  const handleLogDay = () => {
    if (onLogDay && !allLogged) onLogDay(day);
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div
        onClick={() => setIsExpanded(prev => !prev)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.75rem 1rem', background: isToday ? '#f0fdf4' : '#f3f4f6',
          border: isToday ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
          borderRadius: '8px', cursor: 'pointer', userSelect: 'none',
        }}
      >
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{formatDayHeader(day.date)}</span>
          {!isExpanded && (
            <span style={{ color: '#666', fontSize: '0.875rem', marginLeft: '0.75rem' }}>
              {totalCalories} kcal {allLogged ? '· All logged ✓' : ''}
            </span>
          )}
        </div>
        <span style={{ color: '#666', fontSize: '0.875rem' }}>{isExpanded ? '▲' : '▼'}</span>
      </div>

      {isExpanded && (
        <div style={{
          border: '1px solid #e5e7eb', borderTop: 'none',
          borderRadius: '0 0 8px 8px', padding: '0.5rem 1rem',
        }}>
          {(day.meals || []).map((meal, idx) => (
            <div key={meal.meal_type || idx} style={{ marginBottom: '0.75rem' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '0.25rem',
              }}>
                <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#374151', textTransform: 'capitalize' }}>
                  {meal.meal_type}
                </span>
                <span style={{ fontSize: '0.8125rem', color: '#666' }}>
                  {meal.total_calories || 0} kcal
                </span>
              </div>
              {(!meal.items || meal.items.length === 0) ? (
                <p style={{ color: '#9ca3af', fontSize: '0.8125rem', margin: '0.25rem 0' }}>
                  {'No items'}
                </p>
              ) : (
                meal.items.map((item, itemIdx) => (
                  <MealRow key={item.food_id || itemIdx} item={item} />
                ))
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleLogDay}
              disabled={allLogged || isLogging}
              style={{
                padding: '0.5rem 1rem', cursor: allLogged || isLogging ? 'not-allowed' : 'pointer',
                opacity: allLogged || isLogging ? 0.6 : 1,
                background: allLogged ? '#f3f4f6' : '#f0fdf4',
                border: allLogged ? '1px solid #e5e7eb' : '1px solid #bbf7d0',
                borderRadius: '4px', color: '#16a34a', fontWeight: 'bold',
                fontSize: '0.8125rem', minHeight: '36px',
              }}
            >
              {isLogging ? 'Logging...' : allLogged ? 'All Logged ✓' : 'Log This Day'}
            </button>
            <button
              onClick={() => onRegenerateDay && onRegenerateDay(day)}
              disabled={isRegenerating}
              style={{
                padding: '0.5rem 1rem', cursor: isRegenerating ? 'not-allowed' : 'pointer',
                opacity: isRegenerating ? 0.6 : 1,
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px',
                color: '#374151', fontWeight: '500', fontSize: '0.8125rem', minHeight: '36px',
              }}
            >
              {isRegenerating ? 'Regenerating...' : 'Regenerate Day'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
