import { useState, useEffect, useCallback } from 'react';
import { getRecommendations, getAllActivities, getActivityHistory, getActivitySummary, logActivity, deleteActivityLog } from '../api/activityApi.js';
import ActivityCard from './ActivityCard.jsx';
import ActivityPool from './ActivityPool.jsx';
import ActivityLogForm from './ActivityLogForm.jsx';
import ActivityHistory from './ActivityHistory.jsx';
import ActivitySummary from './ActivitySummary.jsx';

export default function ActivitiesPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [reshuffling, setReshuffling] = useState(false);
  const [loggingActivity, setLoggingActivity] = useState(null);

  // Refresh activity data (summary + history) after log/delete operations
  const refreshActivityData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const [summaryRes, historyRes] = await Promise.all([
        getActivitySummary(today),
        getActivityHistory(7),
      ]);
      setSummary(summaryRes.data);
      setHistory(historyRes.data || []);
    } catch (err) {
      console.warn('Failed to refresh activity data:', err);
    }
  }, []);

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

  // Load summary and history on mount
  useEffect(() => {
    refreshActivityData();
  }, [refreshActivityData]);

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
      await refreshActivityData();
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
      await refreshActivityData();
    } catch (err) {
      setError(err.message || 'Failed to delete activity log');
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
      {successMsg && <p style={{ color: '#16a34a' }}>{successMsg}</p>}

      {/* Activity Summary */}
      {summary && (
        <ActivitySummary summary={summary} />
      )}

      {/* Recommendations Section */}
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

      {/* Activity Log Form — shown as dedicated section when an activity is selected */}
      {loggingActivity && (
        <ActivityLogForm
          activity={loggingActivity}
          onSubmit={handleLogSubmit}
          onCancel={handleLogCancel}
        />
      )}

      {/* Activity Pool */}
      {allActivities.length > 0 && (
        <ActivityPool
          activities={allActivities}
          onLogClick={handleLogClick}
          isLogging={loggingActivity}
        />
      )}

      {/* Activity History */}
      <ActivityHistory history={history} onDelete={handleDeleteLog} />
    </div>
  );
}
