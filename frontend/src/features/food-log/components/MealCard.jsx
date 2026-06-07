/**
 * MealCard.jsx
 *
 * Why: The per-meal-type card (header, item list, log-all button, regenerate
 * button) was rendered inline inside `renderDayContent` in MealCalendarSection.
 * Extracting it keeps MealCalendarSection focused on orchestration and makes
 * this card independently testable and reusable.
 */

import { CheckCircle2, RotateCw, RefreshCw, Clock, Scale, Flame } from 'lucide-react';
import { formatCountdown } from '../../../shared/lib/countdown.js';

/** Meal-type display metadata: label, icon, accent colours. */
const MEAL_META = {
  breakfast: { label: 'Breakfast', colorClass: 'text-red-400 bg-red-950/40 border-red-900/30' },
  lunch:     { label: 'Lunch',     colorClass: 'text-red-400 bg-red-950/40 border-red-900/30' },
  dinner:    { label: 'Dinner',    colorClass: 'text-red-400 bg-red-950/40 border-red-900/30' },
  snack:     { label: 'Snack',     colorClass: 'text-red-400 bg-red-950/40 border-red-900/30' },
};

/**
 * Card representing a single meal type (breakfast, lunch, dinner, snack)
 * within a daily meal plan.
 *
 * @param {object}   props
 * @param {object}   props.meal                    - Meal data object from the API.
 * @param {boolean}  props.isNotToday              - Whether the selected day is not today.
 * @param {boolean}  props.isLogging               - Whether this meal is currently being logged.
 * @param {boolean}  props.isRegenerating          - Whether this meal is being regenerated.
 * @param {number}   props.swapRetryAfter          - Seconds left in the regeneration cooldown.
 * @param {boolean}  [props.globalBusy]            - True when ANY mutation is in-flight (log, regen, generate); disables all interactive buttons.
 * @param {Function} props.onLog                   - Called when "Log All" is clicked.
 * @param {Function} props.onRegenerate            - Called when "Regenerate" is clicked.
 * @param {Function} props.onToggleItem            - Called when a single item is toggled.
 * @returns {JSX.Element}
 */
export default function MealCard({
  meal,
  isNotToday,
  isLogging,
  isRegenerating,
  swapRetryAfter,
  globalBusy = false,
  onLog,
  onRegenerate,
  onToggleItem,
}) {
  const meta = MEAL_META[meal.meal_type] ?? { label: meal.meal_type, colorClass: 'text-slate-400 bg-[#222] border-[#333]' };
  const allLogged = meal.items?.every((item) => item.logged);

  return (
    <div
      className={`bg-[#1e1e1e] rounded-xl border border-[#2d2d2d] p-4 transition-all duration-200 ${
        isNotToday ? 'opacity-70' : allLogged ? 'opacity-60' : 'hover:border-red-900/40'
      }`}
    >
      {/* ── Card header ── */}
      <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-sm tracking-tight text-white capitalize">
            {meta.label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {meal.total_calories > 0 && (
            <span className="text-xs font-bold text-slate-400 font-mono">
              {meal.total_calories} kcal
            </span>
          )}

          {/* Regenerate button — only shown for today */}
          {!isNotToday && (
            isRegenerating ? (
              <div className="h-8 px-3 rounded-lg bg-red-950/30 text-red-400 flex items-center justify-center">
                <RotateCw className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              <button
                onClick={onRegenerate}
                disabled={swapRetryAfter > 0 || globalBusy}
                title={globalBusy && swapRetryAfter === 0 ? 'Please wait for the current action to finish' : undefined}
                className={`h-8 px-3 rounded-lg flex items-center gap-1.5 transition-all text-xs font-bold ${
                  swapRetryAfter > 0 || globalBusy
                    ? 'bg-[#222] border border-[#333] text-slate-500 cursor-not-allowed'
                    : 'bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/30 cursor-pointer active:scale-95'
                }`}
              >
                {swapRetryAfter > 0 ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-mono">
                    <Clock className="w-3 h-3" /> {formatCountdown(swapRetryAfter)}
                  </span>
                ) : (
                  <><RefreshCw className="w-3 h-3" /> Regenerate</>
                )}
              </button>
            )
          )}

          {/* Logged / unlogged badge / log-all button */}
          {allLogged ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/30 px-2.5 py-1 rounded-md border border-red-900/30">
              Done ✓
            </span>
          ) : isNotToday ? (
            <span className="text-[10px] uppercase font-semibold text-slate-500 bg-[#222] border border-[#333] px-2 py-0.5 rounded-md">
              Unlogged
            </span>
          ) : (
            <button
              onClick={onLog}
              disabled={isLogging}
              className="flex items-center gap-1 px-3 py-1 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-lg transition-all cursor-pointer min-h-[32px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLogging ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Log All'}
            </button>
          )}
        </div>
      </div>

      {/* ── Item rows ── */}
      {meal.items?.length > 0 && (
        <div className="space-y-3">
          {meal.items.map((item, i) => (
            <div
              key={i}
              className={`flex justify-between items-center p-4 rounded-xl border border-[#2d2d2d] bg-[#1e1e1e] hover:bg-[#252525] transition-all duration-200 ${
                item.logged ? 'opacity-50 border-slate-800 bg-[#151515]' : ''
              }`}
            >
              <div className="space-y-0.5">
                <span className={`text-xs sm:text-sm font-semibold leading-tight block ${item.logged ? 'line-through text-slate-500' : 'text-white'}`}>
                  {item.food_name}
                </span>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-550 font-mono font-sans mt-1">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Scale className="w-3.5 h-3.5 text-slate-500" /> {item.portion_grams} g
                  </span>
                  {item.calories > 0 && (
                    <span className="flex items-center gap-1 font-semibold text-amber-400 bg-amber-950/40 rounded px-1.5 py-0.5 border border-amber-900/30">
                      <Flame className="w-3.5 h-3.5 text-amber-500" /> ~{item.calories} kcal
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.logged ? (
                  <button
                    onClick={() => onToggleItem(meal.meal_type, item.food_id, item.logged)}
                    disabled={globalBusy}
                    className="h-8 px-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white flex items-center gap-1.5 border border-red-800 transition-all cursor-pointer text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    title={globalBusy ? 'Please wait for the current action to finish' : 'Click to mark unconsumed'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Logged</span>
                  </button>
                ) : isNotToday ? null : (
                  <button
                    onClick={() => onToggleItem(meal.meal_type, item.food_id, item.logged)}
                    disabled={globalBusy}
                    className="h-8 px-2.5 rounded-xl border border-[#333] hover:border-red-900/40 bg-[#222] hover:bg-red-950/30 text-slate-400 hover:text-red-400 flex items-center gap-1.5 transition-all cursor-pointer text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    title={globalBusy ? 'Please wait for the current action to finish' : 'Click to mark consumed'}
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-slate-500 bg-[#222] inline-block" />
                    <span>Unlogged</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
