import { useState } from 'react';

export default function ActivityHistory({ history, onDelete }) {
  const [expandedDates, setExpandedDates] = useState({});

  const toggleDate = (date) => {
    setExpandedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  if (!history || history.length === 0) {
    return (
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>{'Activity History'}</h3>
        <p style={{ color: '#666', fontSize: '0.875rem' }}>{'No activity logged yet'}</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '0.75rem' }}>{'Activity History'}</h3>

      {history.map((day) => {
        const isExpanded = expandedDates[day.logged_date];
        const entries = day.entries || [];

        return (
          <div key={day.logged_date} style={{ marginBottom: '1rem' }}>
            {/* Date Header (clickable to expand/collapse) */}
            <div
              onClick={() => toggleDate(day.logged_date)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div>
                <span style={{ fontWeight: 'bold' }}>{day.logged_date}</span>
                <span style={{ color: '#666', fontSize: '0.875rem', marginLeft: '0.75rem' }}>
                  {day.total_minutes} {'min'} &middot; {day.total_burned} {'kcal'}
                </span>
              </div>
              <span style={{ color: '#666', fontSize: '0.875rem' }}>
                {isExpanded ? '▲' : '▼'}
              </span>
            </div>

            {/* Entries (collapsible) */}
            {isExpanded && (
              <div style={{
                border: '1px solid #e5e7eb',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                padding: '0.5rem 1rem',
              }}>
                {entries.length === 0 ? (
                  <p style={{ color: '#666', fontSize: '0.875rem', margin: '0.5rem 0' }}>
                    {'No details available'}
                  </p>
                ) : (
                  entries.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid #f3f4f6',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: '500' }}>{entry.activity_name}</span>
                        <span style={{ color: '#666', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                          {entry.duration_min} {'min'} &middot; {entry.intensity}
                        </span>
                        <div style={{ color: '#666', fontSize: '0.875rem' }}>
                          {'Calories'}: {entry.calories_burned} {'kcal'}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(entry.id);
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          background: 'none',
                          border: '1px solid #ef4444',
                          color: '#ef4444',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          minHeight: '30px',
                        }}
                        title={'Delete entry'}
                      >
                        {'Delete'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
