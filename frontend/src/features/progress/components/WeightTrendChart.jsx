import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { subDays, format, parseISO, isAfter } from 'date-fns';
import { Loader2, BarChart3, AlertCircle } from 'lucide-react';
import { getWeightHistory } from '../api/weightApi.js';

/**
 * Custom dark-mode tooltip so Recharts' default white tooltip
 * doesn't break the dark theme.
 */
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#222] border border-[#333] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{format(parseISO(label), 'MMM d, yyyy')}</p>
      <p className="text-base font-bold text-white font-mono">
        {parseFloat(payload[0].value).toFixed(1)} <span className="text-xs font-normal text-slate-400">kg</span>
      </p>
    </div>
  );
}

/**
 * WeightTrendChart
 *
 * Displays a Recharts LineChart of the user's weight trend.
 * Why explicit dark styles: Recharts uses SVG / DOM defaults (white bg, dark text)
 * that look wrong in a dark theme unless every colour is manually overridden.
 */
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
  const dataMin = weights.length ? Math.min(...weights) : 0;
  const dataMax = weights.length ? Math.max(...weights) : 100;
  const yDomain = [Math.max(0, dataMin - 2), dataMax + 2];

  const rangeButtons = [30, 60, 90];

  /** Shared card wrapper */
  const CardShell = ({ children }) => (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-lux">
      {/* Card header row */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
          <span className="w-1.5 h-4 bg-emerald-600 rounded-full inline-block" />
          Weight Trend
        </h3>
        {/* Range pill buttons */}
        <div className="flex gap-1">
          {rangeButtons.map((days) => (
            <button
              key={days}
              onClick={() => setActiveRange(days)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeRange === days
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  );

  if (loading && entries.length === 0) {
    return (
      <CardShell>
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading chart…
        </div>
      </CardShell>
    );
  }

  if (error && entries.length === 0) {
    return (
      <CardShell>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      </CardShell>
    );
  }

  if (entries.length === 0) {
    return (
      <CardShell>
        <div className="flex flex-col items-center gap-2 py-12 text-slate-500">
          <BarChart3 className="w-8 h-8 opacity-40" />
          <p className="text-sm italic">No weight data yet. Log your first weight to see your trend.</p>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell>
      {filteredEntries.length < 2 && (
        <p className="text-center text-sm text-slate-500 italic py-4">
          {filteredEntries.length === 0
            ? 'No data in the selected range.'
            : 'Log at least 2 entries to display a trend line.'}
        </p>
      )}

      {filteredEntries.length >= 2 && (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={filteredEntries} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis
              dataKey="logged_date"
              tickFormatter={(val) => format(parseISO(val), 'MMM d')}
              stroke="#444"
              tick={{ fill: '#888', fontSize: 11 }}
            />
            <YAxis
              domain={yDomain}
              tickFormatter={(val) => `${val} kg`}
              stroke="#444"
              tick={{ fill: '#888', fontSize: 11 }}
              width={65}
            />
            <Tooltip content={<DarkTooltip />} />
            <Line
              type="monotone"
              dataKey="weight_kg"
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
              activeDot={{ r: 7, fill: '#22c55e', strokeWidth: 0 }}
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
                  position: 'insideTopRight',
                  fill: '#f87171',
                  fontSize: 11,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </CardShell>
  );
}
