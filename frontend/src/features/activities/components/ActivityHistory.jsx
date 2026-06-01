import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, CalendarRange, Clock, Flame, AlertCircle } from 'lucide-react';

export default function ActivityHistory({ history, onDelete }) {
  const [expandedDates, setExpandedDates] = useState({});

  const toggleDate = (date) => {
    setExpandedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  if (!history || history.length === 0) {
    return (
      <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400">
        <AlertCircle className="w-8 h-8 text-slate-350 mx-auto mb-2" />
        <p className="text-sm font-semibold">Workout history is empty</p>
        <p className="text-xs mt-1">Use the panel above to refresh or add your first daily workout!</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/50 shadow-sm space-y-4">
      <h3 className="font-display font-bold text-sm text-slate-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
        <CalendarRange className="w-4 h-4 text-emerald-500" />
        Activity & Exercise History
      </h3>

      <div className="space-y-3">
        {history.map((day) => {
          const isExpanded = expandedDates[day.logged_date];
          const entries = day.entries || [];

          return (
            <div key={day.logged_date} className="overflow-hidden border border-slate-200/60 rounded-xl shadow-xs">
              {/* Collapsed Date Header */}
              <div
                onClick={() => toggleDate(day.logged_date)}
                className="flex justify-between items-center px-4 py-3.5 bg-slate-50/80 hover:bg-slate-5 * 10 transition-colors cursor-pointer select-none border-b border-slate-100"
              >
                <div>
                  <span className="font-semibold text-sm text-slate-705 font-mono">{day.logged_date}</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md ml-3 font-mono">
                    {day.total_minutes} mins • ~{day.total_burned} kcal
                  </span>
                </div>
                <div className="text-slate-400">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Expansion Detail Rows */}
              {isExpanded && (
                <div className="divide-y divide-slate-100 bg-white px-4 py-1">
                  {entries.length === 0 ? (
                    <p className="text-xs text-slate-400 font-semibold text-center py-4">
                      Log details unavailable.
                    </p>
                  ) : (
                    entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex justify-between items-center py-3 text-sm group"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-750 block">{entry.activity_name}</span>
                          <div className="flex gap-3 text-xs text-slate-400 font-medium font-mono">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {entry.duration_min} mins</span>
                            <span className="capitalize bg-slate-100 text-slate-550 border border-slate-200/30 px-1.5 rounded text-[10px]">{entry.intensity}</span>
                            <span className="text-orange-600 font-bold">~{entry.calories_burned} kcal</span>
                          </div>
                        </div>

                        {/* Action Delete log button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(entry.id);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 border border-rose-100 hover:border-rose-200 text-rose-550 hover:text-rose-700 bg-rose-50/40 hover:bg-rose-50 text-xs font-bold rounded-lg transition-colors cursor-pointer min-h-[30px]"
                          title="Delete this workout record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
