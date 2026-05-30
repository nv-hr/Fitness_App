export default function FallbackBanner({ status }) {
  if (status !== 'fallback' && status !== 'unavailable') return null;

  const message = status === 'fallback'
    ? 'Using a backup plan based on your activity history. Some activities may differ from your preferences.'
    : 'No activity history available to generate a plan. Log some activities first, then come back.';

  return (
    <div
      style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        color: '#92400e',
        fontSize: '0.875rem',
        lineHeight: 1.5,
      }}
    >
      {message}
    </div>
  );
}
