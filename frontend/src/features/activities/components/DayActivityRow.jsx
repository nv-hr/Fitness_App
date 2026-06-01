import { RefreshCw, CheckCircle2, Clock, Zap, Flame, RotateCw } from 'lucide-react';

const INTENSITY_META = {
  light: { label: 'Light', badge: 'bg-slate-100 text-slate-655 text-slate-600 border-slate-200' },
  moderate: { label: 'Moderate', badge: 'bg-teal-50 text-teal-700 border-teal-200/50' },
  vigorous: { label: 'High', badge: 'bg-rose-50 text-rose-700 border-rose-200/50' },
};

export default function DayActivityRow({ 
  activity, 
  onSwap, 
  isSwapping, 
  swapRetryAfter, 
  onToggle, 
  disabled = false, 
  completed = false 
}) {
  const isCountingDown = swapRetryAfter != null && swapRetryAfter > 0;
  const isSwapDisabled = isSwapping || isCountingDown;

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 65;
    const paddingSecs = String(s).padStart(2, '0');
    return `${m}:${paddingSecs}`;
  };

  const currentMeta = INTENSITY_META[activity.intensity] || {
    label: activity.intensity,
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div
      className={`flex items-center justify-between p-4 mb-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 rounded-xl transition-all duration-200 ${
        completed ? 'opacity-70 border-slate-100 bg-slate-50/20' : ''
      }`}
      style={{
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {/* Exercise descriptions */}
      <div className="space-y-1.5 flex-1 pr-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-semibold text-sm ${completed ? 'line-through text-slate-400' : 'text-slate-850'}`}>
            {activity.name}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${currentMeta.badge}`}>
            {currentMeta.label}
          </span>
        </div>

        {/* Workout metrics */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-400 font-mono font-sans">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> {activity.duration_min} mins
          </span>
          {activity.calories_burned && (
            <span className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 rounded px-1.5 py-0.5 border border-amber-100/50">
              <Flame className="w-3.5 h-3.5" /> ~{activity.calories_burned} kcal
            </span>
          )}
        </div>
      </div>

      {/* Interactions area */}
      <div className="flex items-center gap-2.5">
        {/* Swap button or spinner — hidden when disabled */}
        {!disabled && (
          isSwapping ? (
            <div className="w-10 h-7 flex items-center justify-center">
              <RotateCw className="w-4 h-4 text-emerald-500 animate-spin" />
            </div>
          ) : (
            <button
              onClick={() => { if (!isSwapDisabled && onSwap) onSwap(activity.activity_id); }}
              disabled={isSwapDisabled}
              className={`h-7 px-2.5 font-bold text-xs rounded-lg flex items-center gap-1 transition-all ${
                isSwapDisabled
                   ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                   : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100/60 cursor-pointer active:scale-95'
              }`}
            >
              {isCountingDown ? (
                <span className="flex items-center gap-0.5 text-[10px] font-mono">
                  Wait {formatCountdown(swapRetryAfter)}
                </span>
              ) : (
                <>
                  <RefreshCw className="w-3" /> Swap
                </>
              )}
            </button>
          )
        )}

        {/* Completion toggle */}
        {!disabled ? (
          <button
            onClick={() => { if (onToggle) onToggle(); }}
            className={`h-8 px-2.5 rounded-xl flex items-center gap-1.5 justify-center transition-all cursor-pointer font-sans font-bold text-xs shadow-xs ${
              completed
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600'
                : 'border border-slate-350 bg-white hover:border-emerald-500 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700'
            }`}
            aria-label={completed ? 'Mark incomplete' : 'Mark completed'}
          >
            {completed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Done</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-white inline-block"></span>
                <span>Active</span>
              </>
            )}
          </button>
        ) : (
          /* Non-today: show completion status indicator (no toggle) */
          <div className="h-8 px-2.5 rounded-xl flex items-center gap-1.5 justify-center font-sans font-bold text-xs text-slate-400 bg-slate-50 border border-slate-100">
            {completed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Done</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full border border-slate-300 bg-slate-100 inline-block"></span>
                <span>Active</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
