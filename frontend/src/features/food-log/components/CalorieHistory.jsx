import { CalendarRange } from 'lucide-react';

/**
 * CalorieHistory
 *
 * Shows a 7-day summary table of total calorie intake.
 * Why explicit hex colours: the parent theme remaps Tailwind's slate/emerald
 * tokens to dark values, so light-mode classes like bg-white / bg-slate-50
 * would render as near-black, making the table unreadable.
 */
export default function CalorieHistory({ history }) {
  if (!history || history.length === 0) {
    return null;
  }

  /**
   * Formats a date string to DD/MM/YYYY (Indonesian locale).
   * Appends a time component to prevent off-by-one errors on date-only strings.
   */
  function formatDate(dateStr) {
    const date = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return (
    <div className="p-5 rounded-xl border space-y-4" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
      <h3 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-1.5 border-b pb-2.5" style={{ color: '#888', borderColor: '#2a2a2a' }}>
        <CalendarRange className="w-4 h-4 text-red-500" />
        Calorie History (Last 7 Days)
      </h3>

      <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#242424' }}>
        {/* Table Grid Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b font-bold text-xs uppercase tracking-wider" style={{ background: '#141414', borderColor: '#242424', color: '#555' }}>
          <div className="col-span-4">Date</div>
          <div className="col-span-4 text-right">Calorie Intake</div>
          <div className="col-span-4 text-right">Entry Count</div>
        </div>

        {/* Table Rows */}
        <div style={{ borderColor: '#222' }}>
          {history.map((day) => (
            <div
              key={day.log_date}
              className="grid grid-cols-12 gap-2 px-4 py-3 text-sm transition-colors items-center border-b last:border-0"
              style={{ borderColor: '#1e1e1e' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1e1e1e'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="col-span-4 font-semibold font-mono" style={{ color: '#aaa' }}>
                {formatDate(day.log_date)}
              </div>
              <div className="col-span-4 text-right font-black font-mono text-emerald-400">
                {day.total_calories} <span className="text-[10px] font-sans font-medium" style={{ color: '#555' }}>kcal</span>
              </div>
              <div className="col-span-4 text-right font-bold font-mono" style={{ color: '#666' }}>
                {day.entry_count} <span className="text-[10px] font-sans font-medium" style={{ color: '#444' }}>items</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
