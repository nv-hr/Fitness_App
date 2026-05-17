import { t } from '../../../shared/i18n/translations.js';
import ActivityCard from './ActivityCard.jsx';

export default function ActivityPool({ activities }) {
  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>
        {t('activities.activityPool')}
      </h3>
      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
        {activities.length} {t('activities.totalActivities')}
      </p>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}
