import { useState, useEffect, useCallback } from 'react';
import { getAllActivities, getActivityHistory, logActivity, deleteActivityLog } from '../api/activityApi.js';
import ActivityPool from './ActivityPool.jsx';
import ActivityLogForm from './ActivityLogForm.jsx';
import ActivityHistory from './ActivityHistory.jsx';
import { Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ActivityLogSection() {
  const [allActivities, setAllActivities] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loggingActivity, setLoggingActivity] = useState(null);

  const refreshHistory = useCallback(async () => {
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
        const [allRes] = await Promise.all([
          getAllActivities(),
        ]);
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
      setSuccessMsg('Activity logged successfully!');
      setLoggingActivity(null);
      await refreshHistory();
      window.dispatchEvent(new CustomEvent('health-system-update'));
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
      window.dispatchEvent(new CustomEvent('health-system-update'));
    } catch (err) {
      setError(err.message || 'Failed to delete activity log');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-semibold animate-pulse">Connecting exercise database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Messaging units */}
      {error && (
        <div className="flex gap-2.5 p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-sm items-center shadow-xs">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-505" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex gap-2.5 p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-sm items-center shadow-xs">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Interactive exercise logging detail modal/panel */}
      {loggingActivity && (
        <div className="border-b border-slate-100 pb-6 mb-2">
          <ActivityLogForm
            activity={loggingActivity}
            onSubmit={handleLogSubmit}
            onCancel={handleLogCancel}
          />
        </div>
      )}

      {/* Encyclopedia/Pool listings */}
      {allActivities.length > 0 && (
        <div className="border-t border-slate-100 pt-6">
          <ActivityPool
            activities={allActivities}
            onLogClick={handleLogClick}
            isLogging={loggingActivity}
          />
        </div>
      )}

      {/* History timeline chart/accordions */}
      <div className="border-t border-slate-100 pt-6">
        <ActivityHistory history={history} onDelete={handleDeleteLog} />
      </div>
    </div>
  );
}
