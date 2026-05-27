import { t } from '../../../shared/i18n/translations.js';

const goalLabels = {
  lose_weight: 'Menurunkan Berat Badan',
  maintain: 'Menjaga Berat Badan',
  gain_weight: 'Menambah Berat Badan',
};

const rateLabels = {
  low: '0.25 kg/minggu',
  medium: '0.5 kg/minggu',
  high: '1 kg/minggu',
};

export default function TdeeResult({ tdee, tdeeRange, calorieTarget, activityLevel, fitnessGoal, calorieRate }) {
  const activityDescription = t('tdee.activity.' + activityLevel) || activityLevel;
  const goalLabel = goalLabels[fitnessGoal] || fitnessGoal;
  const rateLabel = calorieRate ? rateLabels[calorieRate] : null;

  return (
    <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
      <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{t('tdee.yourTdee')}</p>
      {tdeeRange && (
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
          {tdeeRange.min} - {tdeeRange.max} {t('tdee.caloriesPerDay')}
        </p>
      )}
      {activityLevel && (
        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.75rem' }}>
          {activityDescription}
        </p>
      )}

      {calorieTarget && (
        <div style={{ marginTop: '0.75rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{t('tdee.calorieTarget')}</p>
          <span style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: '#22C55E',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '500',
          }}>
            {calorieTarget} {t('tdee.caloriesPerDay')} — {goalLabel}{rateLabel ? ` (${rateLabel})` : ''}
          </span>
        </div>
      )}

      <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#9CA3AF', fontStyle: 'italic' }}>
        {t('tdee.disclaimer')}
      </p>
    </div>
  );
}
