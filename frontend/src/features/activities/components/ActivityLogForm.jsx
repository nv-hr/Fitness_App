import { useState } from 'react';
import { calculateActivityCalories } from './previewCalories.js';
import { Flame, Clock, Zap, Calendar, RotateCw, AlertCircle } from 'lucide-react';

export default function ActivityLogForm({ activity, onSubmit, onCancel }) {
  const [durationMin, setDurationMin] = useState(String(activity.duration_min));
  const [intensity, setIntensity] = useState('moderate');
  const [loggedDate, setLoggedDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const previewCalories = calculateActivityCalories(
    activity.estimated_calories,
    activity.duration_min,
    durationMin,
    intensity
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      await onSubmit({
        activityId: activity.id,
        durationMin: parseInt(durationMin, 10),
        intensity,
        loggedDate,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 p-5 rounded-2xl border border-emerald-150/40 shadow-sm space-y-4 animate-fade-in">
      <div className="border-b border-slate-205 border-slate-200/50 pb-2.5">
        <h3 className="font-display font-bold text-base text-slate-800 flex items-center gap-1.5 capitalize">
          <Zap className="w-5 h-5 text-emerald-500 animate-pulse" />
          Log Activity: {activity.name}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Duration info */}
          <div>
            <label htmlFor="durationMin" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Workout Duration (minutes)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Clock className="w-4 h-4" />
              </div>
              <input
                id="durationMin"
                type="number"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                min="1"
                max="1440"
                required
                className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-505 transition-all font-mono"
              />
            </div>
          </div>

          {/* Intensity selector info */}
          <div>
            <label htmlFor="intensity" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Physical Intensity
            </label>
            <select
              id="intensity"
              value={intensity}
              onChange={(e) => setIntensity(e.target.value)}
              className="block w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-505 transition-all cursor-pointer font-semibold"
            >
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="vigorous">Vigorous</option>
            </select>
          </div>
        </div>

        {/* Date locked display */}
        <div>
          <label htmlFor="loggedDate" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Log Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              id="loggedDate"
              type="date"
              value={loggedDate}
              readOnly
              disabled
              className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-100/70 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed font-mono"
            />
          </div>
        </div>

        {/* Calorie preview card */}
        {previewCalories !== null && (
          <div className="flex justify-between items-center bg-white px-3.5 py-3 rounded-xl border border-slate-200/50">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider font-mono">
              <Flame className="w-4 h-4 text-orange-500" />Estimated Calories Burned:
            </span>
            <span className="text-sm font-black text-slate-755 font-mono bg-orange-50 text-orange-700 px-3 py-1 rounded inline-block border border-orange-100">
              ~{previewCalories} kcal ({intensity === 'light' ? 'Light' : intensity === 'moderate' ? 'Moderate' : 'Vigorous'})
            </span>
          </div>
        )}

        {/* Action button triggers */}
        <div className="flex gap-2.5 pt-2 border-t border-slate-150">
          <button
            type="submit"
            disabled={submitting}
            className="flex-2 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all cursor-pointer shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" /> Logging...
              </>
            ) : (
              'Save Workout Log'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer text-center font-mono"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
