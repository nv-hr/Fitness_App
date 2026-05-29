

export default function ActivityCard({ activity, onLogClick, isLogging }) {
  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem',
      background: '#fafafa',
    }}>
      <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '1rem' }}>
        {activity.name}
      </p>
      <p style={{ margin: '0 0 0.75rem 0', color: '#666', fontSize: '0.875rem' }}>
        {activity.description}
      </p>
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
        <span>
          {'Duration'}: {activity.duration_min} {'minutes'}
        </span>
        <span>
          {'Estimated Calories'}: {activity.estimated_calories} {'kcal'}
        </span>
      </div>
      <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.75rem' }}>
        {'Equipment Needed'}: {
          activity.equipment_needed && activity.equipment_needed.length === 0
            ? 'No equipment'
            : activity.equipment_needed?.join(', ') || 'No equipment'
        }
      </div>

      {/* Log This Button */}
      {onLogClick && (
        <button
          onClick={() => onLogClick(activity)}
          disabled={isLogging}
          style={{
            width: '100%',
            padding: '0.5rem 1rem',
            cursor: isLogging ? 'not-allowed' : 'pointer',
            opacity: isLogging ? 0.6 : 1,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '4px',
            color: '#16a34a',
            fontWeight: 'bold',
            fontSize: '0.875rem',
            minHeight: '36px',
          }}
        >
          {isLogging ? 'Logging...' : 'Log This'}
        </button>
      )}
    </div>
  );
}
