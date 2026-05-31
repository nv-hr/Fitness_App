import { useState } from 'react'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function EmptyStatePlan({ onGenerate, isGenerating }) {
  const [panelExpanded, setPanelExpanded] = useState(false)
  const [selectedDays, setSelectedDays] = useState(() => new Set([0, 1, 3, 5]))

  const selectedCount = selectedDays.size
  const isValid = selectedCount >= 4 && selectedCount <= 6

  const hintMessage = selectedCount < 4
    ? 'Select at least 4 training days'
    : selectedCount > 6
      ? 'Select at most 6 training days'
      : `${selectedCount} of 7 training days selected`

  const hintColor = (selectedCount < 4 || selectedCount > 6) ? '#dc2626' : '#666666'

  const toggleDay = (dayIndex) => {
    if (isGenerating) return
    setSelectedDays((prev) => {
      const next = new Set(prev)
      if (next.has(dayIndex)) next.delete(dayIndex)
      else next.add(dayIndex)
      return next
    })
  }

  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: 700 }}>
        {'No Weekly Plan Yet'}
      </h3>
      <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        {'Generate a personalized weekly activity plan based on your profile and recent activity history.'}
      </p>

      {/* Generate button */}
      <button
        onClick={() => onGenerate(selectedCount)}
        disabled={isGenerating || !isValid}
        style={{
          width: '100%',
          maxWidth: '300px',
          padding: '0.75rem 1rem',
          cursor: (isGenerating || !isValid) ? 'not-allowed' : 'pointer',
          opacity: (isGenerating || !isValid) ? 0.6 : 1,
          background: '#16a34a',
          border: 'none',
          borderRadius: '4px',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '0.875rem',
          minHeight: '44px',
        }}
      >
        {isGenerating ? 'Generating your plan...' : 'Generate My Weekly Plan'}
      </button>

      {/* Days selector panel */}
      <div style={{ marginTop: '1rem', textAlign: 'left' }}>
        {/* Toggle header */}
        <div
          onClick={() => { if (!isGenerating) setPanelExpanded((prev) => !prev) }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: panelExpanded ? '8px 8px 0 0' : '8px',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            opacity: isGenerating ? 0.6 : 1,
            userSelect: 'none',
            fontSize: '0.875rem',
            color: '#666',
          }}
        >
          <span>{'Select training days (optional)'}</span>
          <span style={{ fontSize: '0.75rem' }}>{panelExpanded ? '▲' : '▼'}</span>
        </div>

        {/* Panel body (expanded) */}
        {panelExpanded && (
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              padding: '16px',
              background: '#fff',
              pointerEvents: isGenerating ? 'none' : 'auto',
              opacity: isGenerating ? 0.6 : 1,
            }}
          >
            {/* Checkbox rows — flex-wrap: 4 + 3 layout */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {DAY_LABELS.map((label, index) => {
                const checked = selectedDays.has(index)
                return (
                  <label
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '80px',
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#333',
                      userSelect: 'none',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: '18px',
                        height: '18px',
                        borderRadius: '3px',
                        border: checked ? 'none' : '1px solid #d1d5db',
                        background: checked ? '#16a34a' : '#f3f4f6',
                        position: 'relative',
                        flexShrink: 0,
                      }}
                    >
                      {checked && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: '#fff',
                            fontSize: '12px',
                            lineHeight: 1,
                            fontWeight: 'bold',
                          }}
                        >
                          {'✓'}
                        </span>
                      )}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDay(index)}
                      disabled={isGenerating}
                      style={{
                        position: 'absolute',
                        opacity: 0,
                        width: 0,
                        height: 0,
                        pointerEvents: 'none',
                      }}
                      aria-label={label}
                    />
                    {label}
                  </label>
                )
              })}
            </div>

            {/* Validation hint */}
            <p
              style={{
                marginTop: '8px',
                fontSize: '0.875rem',
                color: hintColor,
                margin: '8px 0 0 0',
              }}
            >
              {hintMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
