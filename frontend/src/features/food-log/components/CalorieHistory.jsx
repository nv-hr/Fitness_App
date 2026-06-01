import { CalendarRange, Activity } from 'lucide-react';

export default function CalorieHistory({ history }) {
  if (!history || history.length === 0) {
    return null;
  }

  function formatDate(dateStr) {
    const date = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00');
    
    // Format options: Indonesia
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/50 shadow-sm space-y-4">
      <h3 className="font-display font-bold text-sm text-slate-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
        <CalendarRange className="w-4 h-4 text-emerald-500" />
        Calorie History (Last 7 Days)
      </h3>

      <div className="border border-slate-200/60 rounded-xl overflow-hidden shadow-xs">
        {/* Table Grid Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
          <div className="col-span-4">Date</div>
          <div className="col-span-4 text-right">Calorie Intake</div>
          <div className="col-span-4 text-right">Entry Count</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-100">
          {history.map((day) => (
            <div
              key={day.log_date}
              className="grid grid-cols-12 gap-2 px-4 py-3 text-sm hover:bg-slate-50/50 transition-colors items-center"
            >
              <div className="col-span-4 font-semibold text-slate-600 font-mono">
                {formatDate(day.log_date)}
              </div>
              <div className="col-span-4 text-right font-black text-slate-750 font-mono text-emerald-600">
                {day.total_calories} <span className="text-[10px] font-sans font-medium text-slate-400 font-mono">kcal</span>
              </div>
              <div className="col-span-4 text-right font-bold text-slate-500 font-mono">
                {day.entry_count} <span className="text-[10px] font-sans font-medium text-slate-400 font-mono">items</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
