import React, { useState, useCallback } from 'react';
import WeightEntryCard from './WeightEntryCard.jsx';
import WeightHistoryTable from './WeightHistoryTable.jsx';
import WeightTrendChart from './WeightTrendChart.jsx';
import TrendPredictionCard from './TrendPredictionCard.jsx';

export default function ProgressPage({ profile }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div>
      <h2 style={{ margin: '0 0 1rem 0' }}>Progress</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <WeightEntryCard onLogSuccess={handleLogSuccess} />
        <WeightTrendChart profile={profile} refreshKey={refreshKey} />
        <TrendPredictionCard profile={profile} refreshKey={refreshKey} />
        <WeightHistoryTable refreshKey={refreshKey} />
      </div>
    </div>
  );
}
