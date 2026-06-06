import { useState } from 'react';
import { format } from 'date-fns';
import { Scale, CalendarDays, StickyNote, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { logWeight } from '../api/weightApi.js';

/**
 * WeightEntryCard
 *
 * Form card for logging a new weight entry.
 * Why Tailwind classes instead of inline styles: keeps the component
 * consistent with the app-wide dark theme token mapping in index.css,
 * and avoids the light-mode colour bleed from the previous implementation.
 */
export default function WeightEntryCard({ onLogSuccess }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [weightKg, setWeightKg] = useState('');
  const [loggedDate, setLoggedDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLog = async () => {
    const w = parseFloat(weightKg);
    if (isNaN(w) || w < 2 || w > 300) {
      setError('Weight must be between 2–300 kg');
      return;
    }
    if (!loggedDate) {
      setError('Date is required');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await logWeight({ weightKg: w, loggedDate, notes });
      setSuccessMsg('Weight logged successfully!');
      setWeightKg('');
      setNotes('');
      if (onLogSuccess) onLogSuccess();
      // Auto-dismiss after 3 s so the success banner doesn't linger
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to log weight');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-lux">
      {/* Card heading */}
      <h3 className="font-display font-bold text-lg text-white flex items-center gap-2 mb-5">
        <span className="w-1.5 h-4 bg-emerald-600 rounded-full inline-block" />
        Log Weight
      </h3>

      {/* Feedback banners */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-950/50 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Date field */}
        <div className="space-y-1.5">
          <label htmlFor="wl-date" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <CalendarDays className="w-3.5 h-3.5" /> Date
          </label>
          <input
            id="wl-date"
            type="date"
            value={loggedDate}
            onChange={(e) => setLoggedDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#222] border border-[#333] focus:border-emerald-600 focus:outline-none transition-colors"
          />
        </div>

        {/* Weight field */}
        <div className="space-y-1.5">
          <label htmlFor="wl-weight" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" /> Weight (kg)
          </label>
          <input
            id="wl-weight"
            type="number"
            step="0.1"
            min="2"
            max="300"
            placeholder="e.g. 75.5"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#222] border border-[#333] focus:border-emerald-600 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Notes field */}
      <div className="space-y-1.5 mb-5">
        <label htmlFor="wl-notes" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <StickyNote className="w-3.5 h-3.5" /> Notes <span className="normal-case font-normal text-slate-600">(optional)</span>
        </label>
        <textarea
          id="wl-notes"
          rows={2}
          placeholder="e.g. After morning workout"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#222] border border-[#333] focus:border-emerald-600 focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* Submit button */}
      <button
        onClick={handleLog}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Logging…
          </>
        ) : (
          'Log Weight'
        )}
      </button>
    </div>
  );
}
