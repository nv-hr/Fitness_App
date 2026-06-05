import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { TrendingDown, TrendingUp, Minus, CalendarCheck, Loader2, AlertCircle, Target } from 'lucide-react';
import { getWeightHistory } from '../api/weightApi.js';
import { useTrendPrediction } from '../hooks/useTrendPrediction.js';

/**
 * Status colour tokens — kept in one place so the three uses (icon, badge, text)
 * stay in sync without prop-drilling a colour string.
 */
const STATUS_CONFIG = {
  green: {
    icon: TrendingDown,
    badgeBg: 'bg-emerald-950/60 border-emerald-700/30',
    badgeText: 'text-emerald-400',
    dotBg: 'bg-emerald-500',
  },
  amber: {
    icon: TrendingUp,
    badgeBg: 'bg-amber-950/60 border-amber-700/30',
    badgeText: 'text-amber-400',
    dotBg: 'bg-amber-500',
  },
  red: {
    icon: TrendingUp,
    badgeBg: 'bg-red-950/60 border-red-700/30',
    badgeText: 'text-red-400',
    dotBg: 'bg-red-500',
  },
  neutral: {
    icon: Minus,
    badgeBg: 'bg-slate-700/40 border-slate-600/30',
    badgeText: 'text-slate-400',
    dotBg: 'bg-slate-500',
  },
};

/**
 * TrendPredictionCard
 *
 * Renders the computed weight-loss/gain rate and estimated goal-completion date.
 * Why inline styles were replaced: they used hard-coded light-mode colours
 * (#374151, #666, #fafafa) that were invisible / clashing in the dark theme.
 */
export default function TrendPredictionCard({ profile, refreshKey }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          setError(err.message || 'Could not load weight data. Try refreshing the page.');
          setLoading(false);
        }
      });
    return () => { cancelled = false; };
  }, [refreshKey]);

  const prediction = useTrendPrediction(entries, profile);

  /** Shared card wrapper */
  const CardShell = ({ children }) => (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-lux">
      <h3 className="font-display font-bold text-lg text-white flex items-center gap-2 mb-5">
        <span className="w-1.5 h-4 bg-emerald-600 rounded-full inline-block" />
        Trend Prediction
      </h3>
      {children}
    </div>
  );

  if (loading && entries.length === 0) {
    return (
      <CardShell>
        <div className="flex items-center justify-center gap-2 py-8 text-slate-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" /> Calculating trend…
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

  if (entries.length === 0 || prediction.insufficientData) {
    return (
      <CardShell>
        <p className="text-center text-sm text-slate-500 italic py-4">
          Log more weight entries to see your trend prediction.
        </p>
      </CardShell>
    );
  }

  // Build display values
  const rateText =
    prediction.direction === 'stable'
      ? 'Stable weight'
      : prediction.direction === 'losing'
      ? `Losing ${Math.abs(prediction.rateKgPerWeek).toFixed(1)} kg / week`
      : `Gaining ${Math.abs(prediction.rateKgPerWeek).toFixed(1)} kg / week`;

  const cfg = STATUS_CONFIG[prediction.colorStatus] || STATUS_CONFIG.neutral;
  const TrendIcon = cfg.icon;

  const confidenceLabel =
    prediction.confidence !== null
      ? prediction.confidence >= 0.7
        ? 'Strong fit'
        : prediction.confidence >= 0.4
        ? 'Moderate fit'
        : 'Weak fit'
      : null;

  return (
    <CardShell>
      <div className="space-y-4">
        {/* Rate row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cfg.dotBg} text-white`}>
              <TrendIcon className="w-4 h-4" />
            </div>
            <span className="text-base font-semibold text-white">{rateText}</span>
          </div>

          {/* Status badge (only when goal is set and not stable) */}
          {!prediction.noGoalSet && !prediction.isStable && prediction.statusLabel && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.badgeBg} ${cfg.badgeText}`}>
              {prediction.statusLabel}
            </span>
          )}
        </div>

        {/* Estimated goal date */}
        {prediction.estimatedDate && !prediction.noGoalSet && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#212121] border border-[#333]">
            <CalendarCheck className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Estimated goal reached</p>
              <p className="text-sm font-semibold text-white">{format(prediction.estimatedDate, 'MMMM d, yyyy')}</p>
            </div>
          </div>
        )}

        {/* No goal set nudge */}
        {prediction.noGoalSet && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#212121] border border-[#333] text-slate-500 text-xs">
            <Target className="w-4 h-4 flex-shrink-0" />
            Set a target weight in your profile to see an estimated completion date.
          </div>
        )}

        {/* Confidence indicator */}
        {confidenceLabel && (
          <p className="text-xs text-slate-600">
            R² = {prediction.confidence?.toFixed(2)} — {confidenceLabel}
          </p>
        )}
      </div>
    </CardShell>
  );
}
