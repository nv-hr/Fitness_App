import { t } from '../../../shared/i18n/translations.js';

const categoryColors = {
  underweight: '#3B82F6',
  normal: '#22C55E',
  overweight: '#EAB308',
  obese: '#EF4444',
};

export default function BmiResult({ bmi, bmiCategory }) {
  const color = categoryColors[bmiCategory] || '#6B7280';

  return (
    <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
      <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{t('bmi.yourBmi')}</p>
      <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{bmi.toFixed(1)}</p>
      <span style={{
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        backgroundColor: color,
        color: 'white',
        fontSize: '0.875rem',
        fontWeight: '500',
      }}>
        {t('bmi.' + bmiCategory)}
      </span>
      <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#9CA3AF', fontStyle: 'italic' }}>
        {t('bmi.disclaimer')}
      </p>
    </div>
  );
}
