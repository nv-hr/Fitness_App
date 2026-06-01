const INTENSITY_COLORS = {
  light: '#6b7280',
  moderate: 'inherit',
  vigorous: '#b45309',
}

export default function DayActivityRow({ activity, onSwap, isSwapping, swapRetryAfter, onToggle, disabled = false, completed = false }) {
  const color = INTENSITY_COLORS[activity.intensity] || 'inherit'
  const isCountingDown = swapRetryAfter != null && swapRetryAfter > 0
  const isSwapDisabled = isSwapping || isCountingDown

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0',
        borderBottom: '1px solid #f3f4f6',
        fontSize: '0.875rem',
        opacity: isSwapping ? 0.6 : (disabled ? 0.5 : 1),
        color: disabled ? '#9ca3af' : 'inherit',
        cursor: disabled ? 'default' : undefined,
        pointerEvents: disabled ? 'none' : 'auto',
        transition: 'opacity 0.2s',
      }}
    >
      <span style={{ fontWeight: 500 }}>{activity.name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color, whiteSpace: 'nowrap' }}>
          {activity.duration_min}min · {activity.intensity}
          {activity.calories_burned ? ` · ${activity.calories_burned} cal` : ''}
        </span>

        {/* Completion toggle — hidden when disabled */}
        {!disabled && (
          <button
            onClick={() => { if (onToggle) onToggle(); }}
            style={{
              width: '44px',
              height: '44px',
              minWidth: '44px',
              padding: '8px',
              cursor: 'pointer',
              background: 'none',
              border: completed ? '2px solid #16a34a' : '2px solid #d1d5db',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: completed ? '#16a34a' : 'transparent',
              transition: 'all 0.15s',
            }}
            aria-label={completed ? 'Mark as incomplete' : 'Mark as completed'}
          >
            {completed ? '✓' : '○'}
          </button>
        )}
        {/* Past days: show completion indicator without toggle */}
        {disabled && completed && (
          <span style={{ color: '#16a34a', fontSize: '16px', fontWeight: 'bold' }}>✓</span>
        )}

        {/* Swap button or spinner — hidden when disabled */}
        {!disabled && (
          isSwapping ? (
            <div
              style={{
                width: '28px',
                height: '28px',
                minWidth: '28px',
                minHeight: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid #16a34a',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'swap-spin 0.6s linear infinite',
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => { if (!isSwapDisabled && onSwap) onSwap(activity.activity_id) }}
              disabled={isSwapDisabled}
              style={{
                width: '56px',
                minHeight: '28px',
                padding: '0 8px',
                cursor: isSwapDisabled ? 'not-allowed' : 'pointer',
                opacity: isSwapDisabled ? 0.5 : 1,
                background: isSwapDisabled ? '#f3f4f6' : '#f0fdf4',
                border: isSwapDisabled ? '1px solid #e5e7eb' : '1px solid #bbf7d0',
                borderRadius: '4px',
                color: isSwapDisabled ? '#999' : '#16a34a',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isSwapDisabled) e.currentTarget.style.background = '#dcfce7'
              }}
              onMouseLeave={(e) => {
                if (!isSwapDisabled) e.currentTarget.style.background = '#f0fdf4'
              }}
            >
              {isCountingDown ? `Wait ${formatCountdown(swapRetryAfter)}` : 'Swap'}
            </button>
          )
        )}
      </div>
    </div>
  )
}
