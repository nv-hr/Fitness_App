const INTENSITY_COLORS = {
  light: '#6b7280',
  moderate: 'inherit',
  vigorous: '#b45309',
}

if (typeof document !== 'undefined' && !document.getElementById('swap-spin-style')) {
  const style = document.createElement('style')
  style.id = 'swap-spin-style'
  style.textContent = '@keyframes swap-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }'
  document.head.appendChild(style)
}

export default function DayActivityRow({ activity, onSwap, isSwapping, swapRetryAfter }) {
  const color = INTENSITY_COLORS[activity.intensity] || 'inherit'
  const isCountingDown = swapRetryAfter != null && swapRetryAfter > 0
  const disabled = isSwapping || isCountingDown

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
        opacity: isSwapping ? 0.6 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <span style={{ fontWeight: 500 }}>{activity.name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color, whiteSpace: 'nowrap' }}>
          {activity.duration_min}min · {activity.intensity}
          {activity.calories_burned ? ` · ${activity.calories_burned} cal` : ''}
        </span>

        {/* Swap button or spinner */}
        {isSwapping ? (
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
            onClick={() => { if (!disabled && onSwap) onSwap() }}
            disabled={disabled}
            style={{
              width: '56px',
              minHeight: '28px',
              padding: '0 8px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              background: disabled ? '#f3f4f6' : '#f0fdf4',
              border: disabled ? '1px solid #e5e7eb' : '1px solid #bbf7d0',
              borderRadius: '4px',
              color: disabled ? '#999' : '#16a34a',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!disabled) e.currentTarget.style.background = '#dcfce7'
            }}
            onMouseLeave={(e) => {
              if (!disabled) e.currentTarget.style.background = '#f0fdf4'
            }}
          >
            {isCountingDown ? `Wait ${formatCountdown(swapRetryAfter)}` : 'Swap'}
          </button>
        )}
      </div>
    </div>
  )
}
