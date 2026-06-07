import { useState } from 'react';
import { CalendarRange, ChevronDown, Coffee, Utensils, Moon, Cookie } from 'lucide-react';

const mealTypeLabels = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const mealIconLabels = {
  breakfast: Coffee,
  lunch: Utensils,
  dinner: Moon,
  snack: Cookie,
};

/**
 * CalorieHistory
 *
 * Shows a 7-day summary table of total calorie intake, with expandable daily food logs.
 * Why explicit hex colours: the parent theme remaps Tailwind's slate/emerald
 * tokens to dark values, so light-mode classes like bg-white / bg-slate-50
 * would render as near-black, making the table unreadable.
 */
export default function CalorieHistory({ history }) {
  // Why expandedDates state: Allows users to expand multiple days in their history independently 
  // without losing context on other days.
  const [expandedDates, setExpandedDates] = useState({});

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

  const toggleDate = (dateStr) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  return (
    <div className="p-5 rounded-xl border space-y-4" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
      <h3 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-1.5 border-b pb-2.5" style={{ color: '#888', borderColor: '#2a2a2a' }}>
        <CalendarRange className="w-4 h-4 text-red-500" />
        Calorie History (Last 7 Days)
      </h3>

      <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#242424' }}>
        {/* Table Grid Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b font-bold text-xs uppercase tracking-wider" style={{ background: '#141414', borderColor: '#242424', color: '#555' }}>
          <div className="col-span-4 flex items-center gap-6">Date</div>
          <div className="col-span-4 text-right">Calorie Intake</div>
          <div className="col-span-4 text-right">Entry Count</div>
        </div>

        {/* Table Rows */}
        <div style={{ borderColor: '#222' }}>
          {history.map((day) => {
            const isExpanded = !!expandedDates[day.log_date];
            return (
              <div key={day.log_date} className="border-b last:border-0" style={{ borderColor: '#1e1e1e' }}>
                <div
                  className="grid grid-cols-12 gap-2 px-4 py-3 text-sm transition-colors items-center cursor-pointer"
                  onClick={() => toggleDate(day.log_date)}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1e1e1e'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="col-span-4 font-semibold font-mono flex items-center gap-2" style={{ color: '#aaa' }}>
                    <ChevronDown
                      className="w-4 h-4 text-slate-500 transition-transform duration-200"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                    {formatDate(day.log_date)}
                  </div>
                  <div className="col-span-4 text-right font-black font-mono text-emerald-400">
                    {day.total_calories} <span className="text-[10px] font-sans font-medium" style={{ color: '#555' }}>kcal</span>
                  </div>
                  <div className="col-span-4 text-right font-bold font-mono" style={{ color: '#666' }}>
                    {day.entry_count} <span className="text-[10px] font-sans font-medium" style={{ color: '#444' }}>items</span>
                  </div>
                </div>

                {/* Detailed Foods Nested Accordion */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 bg-[#141414] border-t border-[#1e1e1e] space-y-2.5">
                    {day.foods && day.foods.length > 0 ? (
                      <div className="divide-y divide-[#1e1e1e]">
                        {day.foods.map((food, idx) => {
                          const MealIcon = mealIconLabels[food.meal_type] || Utensils;
                          return (
                            <div key={food.id || idx} className="flex justify-between items-center py-2.5 text-xs">
                              <div className="flex items-center gap-2.5 text-slate-300">
                                <MealIcon className="w-3.5 h-3.5 text-slate-500" />
                                <span className="font-semibold">{food.food_name}</span>
                                <span 
                                  className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono" 
                                  style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#fca5a5' }}
                                >
                                  {mealTypeLabels[food.meal_type] || food.meal_type}
                                </span>
                              </div>
                              <div className="font-mono text-slate-400">
                                {food.portion_grams}g <span style={{ color: '#333' }}>•</span> {food.calories} kcal
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 py-2 text-center font-medium">
                        No individual items logged.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

