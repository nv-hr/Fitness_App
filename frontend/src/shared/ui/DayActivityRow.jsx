import { RefreshCw, CheckCircle2, Clock, Zap, Flame, RotateCw } from 'lucide-react';

const INTENSITY_META = {
  light: { label: 'Light', badge: 'bg-slate-800/80 text-slate-200 border-slate-700/50' },
  moderate: { label: 'Moderate', badge: 'bg-teal-950/60 text-teal-300 border-teal-900/50' },
  vigorous: { label: 'High', badge: 'bg-rose-950/60 text-rose-300 border-rose-900/50' },
};

export default function DayActivityRow({ 
  activity, 
  onSwap, 
  isSwapping, 
  swapRetryAfter, 
  onToggle, 
  disableSwap = false,
  disableToggle = false, 
  completed = false 
}) {
  const isCountingDown = swapRetryAfter != null && swapRetryAfter > 0;
  const isSwapDisabled = isSwapping || isCountingDown;

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const paddingSecs = String(s).padStart(2, '0');
    return `${m}:${paddingSecs}`;
  };

  const currentMeta = INTENSITY_META[activity.intensity] || {
    label: activity.intensity,
    badge: 'bg-slate-800/80 text-slate-200 border-slate-700/50',
  };

  return (
    <div
      className={`flex items-center justify-between p-4 mb-3.5 bg-[#1e1e1e] hover:bg-[#252525] border border-[#2d2d2d] rounded-xl transition-all duration-200 ${
        completed ? 'opacity-50 border-slate-800 bg-[#151515]' : ''
      }`}
      style={{
        pointerEvents: 'auto',
      }}
    >
      {/* Exercise descriptions */}
      <div className="space-y-1.5 flex-1 pr-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-semibold text-sm ${completed ? 'line-through text-slate-500' : 'text-white'}`}>
            {activity.name}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${currentMeta.badge}`}>
            {currentMeta.label}
          </span>
        </div>

        {/* Workout metrics */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-550 font-mono font-sans">
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> {activity.duration_min} mins
          </span>
          {activity.calories_burned && (
            <span className="flex items-center gap-1 font-semibold text-amber-400 bg-amber-950/40 rounded px-1.5 py-0.5 border border-amber-900/30">
              <Flame className="w-3.5 h-3.5 text-amber-500" /> ~{activity.calories_burned} kcal
            </span>
          )}
        </div>
      </div>

      {/* Interactions area */}
      <div className="flex items-center gap-2.5">
        {/* Swap button or spinner */}
        {isSwapping ? (
          <div className="w-10 h-7 flex items-center justify-center">
            <RotateCw className="w-4 h-4 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <button
            onClick={() => { if (!isSwapDisabled && !disableSwap && onSwap) onSwap(activity.activity_id); }}
            disabled={isSwapDisabled || disableSwap}
            className={`h-7 px-2.5 font-bold text-xs rounded-lg flex items-center gap-1 transition-all ${
              isSwapDisabled || disableSwap
                 ? 'bg-[#222] border border-[#333] text-slate-500 cursor-not-allowed'
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
        )}

        {/* Completion toggle */}
        <button
          disabled={isSwapping || disableToggle}
          onClick={() => { if (!isSwapping && !disableToggle && onToggle) onToggle(); }}
          className={`h-8 px-2.5 rounded-xl flex items-center gap-1.5 justify-center transition-all font-sans font-bold text-xs shadow-xs ${
            (isSwapping || disableToggle) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          } ${
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
      </div>
    </div>
  );
}
