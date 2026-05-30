const INTENSITY_COLORS = {
  light: '#6b7280',
  moderate: 'inherit',
  vigorous: '#b45309',
};

export default function DayActivityRow({ activity }) {
  const color = INTENSITY_COLORS[activity.intensity] || 'inherit';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0',
        borderBottom: '1px solid #f3f4f6',
        fontSize: '0.875rem',
      }}
    >
      <span style={{ fontWeight: 500 }}>{activity.name}</span>
      <span style={{ color, whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
        {activity.duration_min}min · {activity.intensity}
      </span>
    </div>
  );
}
