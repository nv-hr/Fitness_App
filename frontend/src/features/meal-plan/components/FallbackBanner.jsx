export default function FallbackBanner({ status }) {
  if (status !== 'fallback') return null;
  return (
    <div style={{
      background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px',
      padding: '0.75rem 1rem', marginBottom: '1rem', color: '#92400e', fontSize: '0.875rem', lineHeight: 1.5,
    }}>
      {'Using a backup meal plan based on your available ingredients. Meal variety may be limited.'}
    </div>
  );
}
