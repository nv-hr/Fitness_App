/**
 * DateSwitcher.jsx
 *
 * Why: The "prev / back-to-today / next" date navigation widget was duplicated
 * almost identically in MealCalendarSection and ActivityCalendarSection.
 * Sharing it means one styling fix propagates everywhere.
 */

import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

/**
 * A date navigation widget with previous-day, next-day, and back-to-today controls.
 *
 * @param {object}   props
 * @param {Date}     props.selectedDay  - The currently selected date.
 * @param {Function} props.onPrev       - Callback fired when the user clicks "previous day".
 * @param {Function} props.onNext       - Callback fired when the user clicks "next day".
 * @param {Function} props.onGoToday    - Callback fired when the user clicks "Back to Today".
 * @param {string}   [props.label='Active Date'] - Small label shown above the formatted date.
 * @returns {JSX.Element}
 */
export default function DateSwitcher({ selectedDay, onPrev, onNext, onGoToday, label = 'Active Date' }) {
  const isToday = format(selectedDay, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-[#2d2d2d] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Date display */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-950/40 rounded-xl border border-red-900/30 text-red-400">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
            {label}
          </span>
          <span className="font-display font-extrabold text-white text-base flex items-center gap-2">
            {format(selectedDay, 'EEEE, d MMMM yyyy')}
            {isToday && (
              <span className="text-[10px] bg-red-950/60 text-red-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-normal border border-red-900/30">
                Today
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Navigation controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          className="p-2 bg-[#222] hover:bg-[#2d2d2d] text-slate-400 rounded-xl border border-[#333] hover:border-[#444] transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          title="Previous Day"
        >
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onGoToday}
          disabled={isToday}
          className="px-4 py-2 bg-red-950/30 hover:bg-red-950/50 disabled:bg-[#222] text-red-400 disabled:text-slate-500 font-bold text-xs rounded-xl border border-red-900/30 disabled:border-[#333] transition-all cursor-pointer disabled:cursor-not-allowed min-h-[40px]"
        >
          Back to Today
        </button>

        <button
          onClick={onNext}
          className="p-2 bg-[#222] hover:bg-[#2d2d2d] text-slate-400 rounded-xl border border-[#333] hover:border-[#444] transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          title="Next Day"
        >
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
