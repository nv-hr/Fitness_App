import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp } from 'lucide-react';
import WeightEntryCard from './WeightEntryCard.jsx';
import WeightHistoryTable from './WeightHistoryTable.jsx';
import WeightTrendChart from './WeightTrendChart.jsx';
import TrendPredictionCard from './TrendPredictionCard.jsx';
import { getProfile } from '../../profile/api/profileApi.js';

/**
 * ProgressPage
 *
 * Container page for the weight-tracking feature set.
 * Why this wrapper: keeps route-level concerns (page header, layout) separated
 * from the individual tracking widgets, which are independently testable.
 */
export default function ProgressPage() {
  const [profile, setProfile] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getProfile()
      .then((data) => setProfile(data.data.profile))
      .catch(() => {/* profile may not exist yet */});
  }, [refreshKey]);

  useEffect(() => {
    const handleUpdate = () => {
      setRefreshKey((k) => k + 1);
    };
    window.addEventListener('health-system-update', handleUpdate);
    return () => {
      window.removeEventListener('health-system-update', handleUpdate);
    };
  }, []);

  /** Bubble success upward so all cards refetch their data simultaneously */
  const handleLogSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1);
    window.dispatchEvent(new CustomEvent('health-system-update', { detail: { type: 'plan-update' } }));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight" style={{ color: '#fff' }}>
            Health Progress Tracker
          </h1>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed">
            Track your weight over time, visualise trends, and predict when you'll hit your goal.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-slate-500 text-xs">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Long-term Analytics</span>
        </div>
      </div>

      {/* Widgets stacked vertically */}
      <WeightEntryCard onLogSuccess={handleLogSuccess} />
      <WeightTrendChart profile={profile} refreshKey={refreshKey} />
      <TrendPredictionCard profile={profile} refreshKey={refreshKey} />
      <WeightHistoryTable refreshKey={refreshKey} />
    </div>
  );
}
