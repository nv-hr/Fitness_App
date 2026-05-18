import { t } from '../../../shared/i18n/translations.js';

export default function CalorieHistory({ history }) {
  if (!history || history.length === 0) {
    return null;
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>{t('foodLog.history')}</h3>
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          padding: '0.5rem',
          background: '#f9fafb',
          fontWeight: 'bold',
          fontSize: '0.875rem',
        }}>
          <span>{t('foodLog.date')}</span>
          <span style={{ textAlign: 'right' }}>{t('foodLog.calories')}</span>
          <span style={{ textAlign: 'right' }}>{t('foodLog.entries')}</span>
        </div>
        {/* Rows */}
        {history.map((day) => (
          <div
            key={day.log_date}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              padding: '0.5rem',
              borderBottom: '1px solid #f3f4f6',
              fontSize: '0.875rem',
            }}
          >
            <span>{formatDate(day.log_date)}</span>
            <span style={{ textAlign: 'right' }}>{day.total_calories} kcal</span>
            <span style={{ textAlign: 'right' }}>{day.entry_count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
