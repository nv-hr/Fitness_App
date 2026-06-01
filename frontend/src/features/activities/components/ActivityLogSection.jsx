import { useState, useEffect, useCallback } from 'react';
import { getRecommendations, getAllActivities, getActivityHistory, logActivity, deleteActivityLog } from '../api/activityApi.js';
import ActivityCard from './ActivityCard.jsx';
import ActivityPool from './ActivityPool.jsx';
import ActivityLogForm from './ActivityLogForm.jsx';
import ActivityHistory from './ActivityHistory.jsx';

export default function ActivityLogSection() {
  const [recommendations, setRecommendations] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [reshuffling, setReshuffling] = useState(false);
  const [loggingActivity, setLoggingActivity] = useState(null);

  const refreshHistory = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const historyRes = await getActivityHistory(7);
      setHistory(historyRes.data || []);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [recRes, allRes] = await Promise.all([
          getRecommendations(),
          getAllActivities(),
        ]);
        setRecommendations(recRes.data?.activities || []);
        setAllActivities(allRes.data?.activities || []);
        await refreshHistory();
      } catch (err) {
        setError(err.message || 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshHistory]);

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

  const handleLogClick = (activity) => {
    setLoggingActivity(activity);
    setError('');
    setSuccessMsg('');
  };

  const handleLogSubmit = async (data) => {
    try {
      setError('');
      setSuccessMsg('');
      await logActivity(data);
      setSuccessMsg('Activity logged successfully');
      setLoggingActivity(null);
      await refreshHistory();
    } catch (err) {
      setError(err.message || 'Failed to log activity');
    }
  };

  const handleLogCancel = () => {
    setLoggingActivity(null);
    setError('');
  };

  const handleDeleteLog = async (logId) => {
    try {
      setError('');
      await deleteActivityLog(logId);
      await refreshHistory();
    } catch (err) {
      setError(err.message || 'Failed to delete activity log');
    }
  };

  if (loading) {
    return <div style={{ padding: '1rem 0' }}>{'Loading...'}</div>;
  }

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: '#16a34a' }}>{successMsg}</p>}

      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>
          {"Today's Recommendations"}
        </h3>

        {recommendations.length === 0 ? (
          <p style={{ color: '#666' }}>{'No recommendations available'}</p>
        ) : (
          recommendations.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onLogClick={handleLogClick}
              isLogging={loggingActivity?.id === activity.id}
            />
          ))
        )}

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

      {loggingActivity && (
        <ActivityLogForm
          activity={loggingActivity}
          onSubmit={handleLogSubmit}
          onCancel={handleLogCancel}
        />
      )}

      {allActivities.length > 0 && (
        <ActivityPool
          activities={allActivities}
          onLogClick={handleLogClick}
          isLogging={loggingActivity}
        />
      )}

      <ActivityHistory history={history} onDelete={handleDeleteLog} />
    </div>
  );
}