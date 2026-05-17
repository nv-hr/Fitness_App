import { t } from '../../../shared/i18n/translations.js';

export default function CalorieSummary({ totalConsumed, calorieTarget, remaining, isExtremeDeficit }) {
  const progressPercent = calorieTarget > 0 ? Math.min((totalConsumed / calorieTarget) * 100, 100) : 0;
  const isOverTarget = calorieTarget > 0 && totalConsumed > calorieTarget;
  const barColor = isOverTarget || isExtremeDeficit ? '#ef4444' : '#22c55e';

  return (
    <div style={{
      background: isOverTarget || isExtremeDeficit ? '#fef2f2' : '#f0fdf4',
      border: `1px solid ${isOverTarget || isExtremeDeficit ? '#fecaca' : '#bbf7d0'}`,
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontWeight: 'bold' }}>{t('foodLog.consumed')}: {totalConsumed} kkal</span>
        {calorieTarget && <span>{t('foodLog.target')}: {calorieTarget} kkal</span>}
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '12px',
        background: '#e5e7eb',
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '0.5rem',
      }}>
        <div style={{
          width: `${progressPercent}%`,
          height: '100%',
          background: barColor,
          borderRadius: '6px',
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Remaining */}
      {calorieTarget && (
        <div style={{ fontSize: '0.875rem', color: isOverTarget ? '#dc2626' : '#16a34a' }}>
          {isOverTarget
            ? `${t('foodLog.overTarget')} (+${totalConsumed - calorieTarget} kkal)`
            : `${t('foodLog.remaining')}: ${remaining} kkal`
          }
        </div>
      )}

      {/* Extreme deficit warning */}
      {isExtremeDeficit && totalConsumed > 0 && (
        <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 'bold' }}>
          ⚠ {t('foodLog.extremeDeficit')}
        </div>
      )}
    </div>
  );
}
