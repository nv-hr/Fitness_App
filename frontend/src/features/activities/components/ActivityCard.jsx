import { t } from '../../../shared/i18n/translations.js';

export default function ActivityCard({ activity }) {
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
          {t('activities.duration')}: {activity.duration_min} {t('activities.minutes')}
        </span>
        <span>
          {t('activities.estimatedCalories')}: {activity.estimated_calories} {t('activities.calories')}
        </span>
      </div>
      <div style={{ fontSize: '0.875rem', color: '#666' }}>
        {t('activities.equipment')}: {
          activity.equipment_needed && activity.equipment_needed.length === 0
            ? t('activities.noEquipment')
            : activity.equipment_needed?.join(', ') || t('activities.noEquipment')
        }
      </div>
    </div>
  );
}
