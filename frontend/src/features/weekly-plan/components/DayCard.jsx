import { useState, useMemo } from 'react'
import DayActivityRow from './DayActivityRow.jsx'
import RateLimitedButton from './RateLimitedButton.jsx'

function formatDayHeader(dateStr) {
  if (!dateStr) return 'Unknown date'
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return 'Unknown date'
  const options = { weekday: 'long', month: 'long', day: 'numeric' }
  return d.toLocaleDateString('en-US', options)
}

export default function DayCard({ day, dayIndex, onRegenerateDay, isRegenerating, retryAfter, onSwapActivity, swappingActivityId, swapRetryAfter }) {
  // Rest day mode — static green card, no interactivity
  if (day.rest_day) {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '12px 1rem',
          }}
        >
          <h4 style={{ fontWeight: 'bold', fontSize: '1rem', margin: '0 0 8px 0' }}>
            {'Rest Day — ' + formatDayHeader(day.date)}
          </h4>
          <p style={{ color: '#666', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
            {'🛌 Take a rest. Recovery is essential for progress.'}
          </p>
        </div>
      </div>
    )
  }

  const [isExpanded, setIsExpanded] = useState(false)

  const totalMinutes = useMemo(() => {
    return (day.activities || []).reduce((sum, a) => sum + (a.duration_min || 0), 0)
  }, [day.activities])

  const activityCount = (day.activities || []).length

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Clickable header */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
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
          <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{formatDayHeader(day.date)}</span>
          {!isExpanded && (
            <span style={{ color: '#666', fontSize: '0.875rem', marginLeft: '0.75rem' }}>
              {activityCount} {activityCount === 1 ? 'activity' : 'activities'} · {totalMinutes}min total
            </span>
          )}
        </div>
        <span style={{ color: '#666', fontSize: '0.875rem' }}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            padding: '0.5rem 1rem',
          }}
        >
          {activityCount === 0 ? (
            <p style={{ color: '#666', fontSize: '0.875rem', margin: '0.5rem 0' }}>
              {'No activities scheduled for this day'}
            </p>
          ) : (
            (day.activities || []).map((activity, idx) => (
              <DayActivityRow
                key={activity.activity_id || idx}
                activity={activity}
                onSwap={() => onSwapActivity && onSwapActivity(activity.activity_id, dayIndex)}
                isSwapping={swappingActivityId === activity.activity_id}
                swapRetryAfter={swapRetryAfter}
              />
            ))
          )}

          {/* Regenerate Button — shown inside expanded card */}
          <div style={{ marginTop: '0.75rem' }}>
            <RateLimitedButton
              onClick={() => onRegenerateDay && onRegenerateDay(day)}
              isLoading={isRegenerating}
              retryAfter={retryAfter}
            >
              {'Regenerate Day'}
            </RateLimitedButton>
          </div>
        </div>
      )}
    </div>
  )
}
