import { useState, useEffect } from 'react';
import { Trash2, Loader2, AlertCircle, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { getWeightHistory, deleteWeightEntry } from '../api/weightApi.js';

/**
 * WeightHistoryTable
 *
 * Displays the user's logged weight entries in a styled dark-mode table.
 * Why Tailwind over inline styles: the previous inline styles used light-mode
 * colour tokens (#e5e7eb, #fafafa) that clashed with the dark theme; switching
 * to explicit dark tokens makes the component visually consistent with the rest
 * of the authenticated app shell.
 */
export default function WeightHistoryTable({ refreshKey }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getWeightHistory();
      setEntries(response.data.entries || []);
    } catch (err) {
      setError(err.message || 'Failed to load weight history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshKey]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteWeightEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete entry');
    } finally {
      setDeletingId(null);
    }
  };

  /** Shared card shell so every state gets the same outer chrome */
  const CardShell = ({ children }) => (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 shadow-lux">
      <h3 className="font-display font-bold text-lg text-white flex items-center gap-2 mb-5">
        <span className="w-1.5 h-4 bg-emerald-600 rounded-full inline-block" />
        Weight History
      </h3>
      {children}
    </div>
  );

  if (loading) {
    return (
      <CardShell>
        <div className="flex items-center justify-center gap-2 py-8 text-slate-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading history…
        </div>
      </CardShell>
    );
  }

  if (error) {
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
        <div className="flex flex-col items-center gap-2 py-8 text-slate-500">
          <ClipboardList className="w-8 h-8 opacity-40" />
          <p className="text-sm italic">No weight entries yet. Log your first weight above.</p>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell>
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-950/50 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Responsive scrollable table wrapper */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2d2d2d]">
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Weight</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
              <th className="py-2.5 px-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-3 text-slate-300 font-mono text-xs">
                  {entry.logged_date ? format(new Date(entry.logged_date), 'MMM d, yyyy') : ''}
                </td>
                <td className="py-3 px-3 font-bold font-mono" style={{ color: '#fff' }}>
                  {parseFloat(entry.weight_kg).toFixed(1)}
                  <span className="ml-1 text-xs font-normal text-slate-500">kg</span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      entry.source === 'auto'
                        ? 'bg-slate-700/60 text-slate-300'
                        : 'bg-emerald-950/60 text-emerald-400 border border-emerald-700/30'
                    }`}
                  >
                    {entry.source === 'auto' ? 'Auto' : 'Manual'}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-950/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Delete entry"
                  >
                    {deletingId === entry.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardShell>
  );
}
