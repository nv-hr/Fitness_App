import { useState, useEffect } from 'react';
import { getRecommendations, getAllActivities } from '../api/activityApi.js';
import ActivityCard from './ActivityCard.jsx';
import ActivityPool from './ActivityPool.jsx';


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
        setError(err.message || 'Failed to load activities');
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
      setError(err.message || 'Failed to load activities');
    } finally {
      setReshuffling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
        {'Loading...'}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
      <h2>{'Activity Recommendations'}</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        {'Suggested activities for your fitness goal'}
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Recommendations Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>
          {"Today's Recommendations"}
        </h3>

        {recommendations.length === 0 ? (
          <p style={{ color: '#666' }}>{'No recommendations available'}</p>
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
          {reshuffling ? 'Loading...' : 'Shuffle'}
        </button>
      </div>

      {/* Activity Pool */}
      {allActivities.length > 0 && (
        <ActivityPool activities={allActivities} />
      )}
    </div>
  );
}
