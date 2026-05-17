import { useState, useEffect } from 'react';
import { getRecommendations, getAllActivities } from '../api/activityApi.js';
import ActivityCard from './ActivityCard.jsx';
import ActivityPool from './ActivityPool.jsx';
import { t } from '../../../shared/i18n/translations.js';

export default function ActivitiesPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reshuffling, setReshuffling] = useState(false);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [recRes, allRes] = await Promise.all([
          getRecommendations(),
          getAllActivities(),
        ]);
        setRecommendations(recRes.data?.activities || []);
        setAllActivities(allRes.data?.activities || []);
      } catch (err) {
        setError(err.message || t('activities.error'));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleReshuffle = async () => {
    try {
      setReshuffling(true);
      setError('');
      const recRes = await getRecommendations();
      setRecommendations(recRes.data?.activities || []);
    } catch (err) {
      setError(err.message || t('activities.error'));
    } finally {
      setReshuffling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
        {t('auth.loading')}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
      <h2>{t('activities.title')}</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        {t('activities.subtitle')}
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Recommendations Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>
          {t('activities.yourRecommendations')}
        </h3>

        {recommendations.length === 0 ? (
          <p style={{ color: '#666' }}>{t('activities.noRecommendations')}</p>
        ) : (
          recommendations.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))
        )}

        {/* Reshuffle Button */}
        <button
          onClick={handleReshuffle}
          disabled={reshuffling}
          style={{
            width: '100%',
            padding: '0.75rem',
            cursor: reshuffling ? 'not-allowed' : 'pointer',
            marginTop: '0.5rem',
            opacity: reshuffling ? 0.6 : 1,
          }}
        >
          {reshuffling ? t('auth.loading') : t('activities.reshuffle')}
        </button>
      </div>

      {/* Activity Pool */}
      {allActivities.length > 0 && (
        <ActivityPool activities={allActivities} />
      )}
    </div>
  );
}
