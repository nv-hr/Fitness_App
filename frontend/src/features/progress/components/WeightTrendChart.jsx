import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { subDays, format, parseISO, isAfter } from 'date-fns';
import { getWeightHistory } from '../api/weightApi.js';

export default function WeightTrendChart({ profile, refreshKey }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRange, setActiveRange] = useState(30);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getWeightHistory(90)
      .then((response) => {
        if (!cancelled) {
          setEntries(response.data.entries || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load weight data');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const today = new Date();
  const cutoffDate = subDays(today, activeRange);

  const filteredEntries = useMemo(() => {
    const filtered = entries.filter((e) => {
      const d = parseISO(e.logged_date);
      return isAfter(d, cutoffDate) || d.getTime() === cutoffDate.getTime();
    });
    return filtered.sort((a, b) => a.logged_date.localeCompare(b.logged_date));
  }, [entries, cutoffDate]);

  const weights = filteredEntries.map((e) => parseFloat(e.weight_kg));
  const dataMin = Math.min(...weights);
  const dataMax = Math.max(...weights);
  const yDomain = [Math.max(0, dataMin - 2), dataMax + 2];

  const rangeButtons = [30, 60, 90];

  if (loading && entries.length === 0) {
    return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', background: '#fafafa' }}>
        <h3 style={{ margin: '0 0 0.75rem 0' }}>Weight Trend</h3>
        <div style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>Loading chart...</div>
      </div>
    );
  }

  if (error && entries.length === 0) {
    return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', background: '#fafafa' }}>
        <h3 style={{ margin: '0 0 0.75rem 0' }}>Weight Trend</h3>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', background: '#fafafa' }}>
        <h3 style={{ margin: '0 0 0.75rem 0' }}>Weight Trend</h3>
        <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
          No weight data yet. Log your first weight to see your trend.
        </p>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', background: '#fafafa' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>Weight Trend</h3>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {rangeButtons.map((days) => (
            <button
              key={days}
              onClick={() => setActiveRange(days)}
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.8rem',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                cursor: 'pointer',
                background: activeRange === days ? '#2563eb' : '#f3f4f6',
                color: activeRange === days ? '#fff' : '#374151',
                minHeight: '36px',
              }}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {filteredEntries.length === 0 && (
        <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
          No data in selected range.
        </p>
      )}

      {filteredEntries.length === 1 && (
        <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
          At least 2 weight entries are needed to show a trend. Log more weights.
        </p>
      )}

      {filteredEntries.length >= 2 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredEntries} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="logged_date"
              tickFormatter={(val) => format(parseISO(val), 'MMM d')}
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis
              domain={yDomain}
              tickFormatter={(val) => `${val} kg`}
              stroke="#9ca3af"
              fontSize={12}
              width={70}
            />
            <Tooltip
              labelFormatter={(val) => format(parseISO(val), 'MMM d, yyyy')}
              formatter={(val) => [`${parseFloat(val).toFixed(1)} kg`, 'Weight']}
            />
            <Line
              type="monotone"
              dataKey="weight_kg"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4, fill: '#2563eb' }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
            {profile?.target_weight_kg && (
              <ReferenceLine
                y={profile.target_weight_kg}
                stroke="#dc2626"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Goal: ${profile.target_weight_kg} kg`,
                  position: 'right',
                  fill: '#dc2626',
                  fontSize: 12,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
