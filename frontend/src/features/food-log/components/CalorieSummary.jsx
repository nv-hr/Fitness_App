import { Flame, Target, ShieldAlert, Heart, CheckCircle2 } from 'lucide-react';

export default function CalorieSummary({ totalConsumed, calorieTarget, remaining, isExtremeDeficit }) {
  const progressPercent = calorieTarget > 0 ? Math.min((totalConsumed / calorieTarget) * 100, 100) : 0;
  const isOverTarget = calorieTarget > 0 && totalConsumed > calorieTarget;
  
  // Decide badge styling and progress bar coloring
  let cardBg = 'bg-[#1a1a1a] border-[#2d2d2d] shadow-lux';
  let barGradient = 'from-emerald-500 to-emerald-600';
  let statusText = 'text-slate-400';
  let statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;

  if (isOverTarget) {
    cardBg = 'bg-[#2d1212] border-[#4c1a1a] shadow-xs';
    barGradient = 'from-rose-500 to-orange-400';
    statusText = 'text-rose-500 font-semibold';
    statusIcon = <ShieldAlert className="w-4 h-4 text-rose-500" />;
  } else if (isExtremeDeficit && totalConsumed > 0) {
    cardBg = 'bg-[#2a1e12] border-amber-900/60 shadow-xs';
    barGradient = 'from-amber-500 to-yellow-400';
    statusText = 'text-amber-500 font-semibold';
    statusIcon = <ShieldAlert className="w-4 h-4 text-amber-500" />;
  }
  return (
    <div className={`p-6 rounded-2xl border transition-all duration-300 ${cardBg}`}>
      {/* Top metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        {/* Consumed */}
        <div className="space-y-1">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" /> Consumed
          </p>
          <p className="text-xl sm:text-2xl font-display font-black text-slate-800">
            {totalConsumed} <span className="text-xs sm:text-sm font-sans font-medium text-slate-500">kcal</span>
          </p>
        </div>

        {/* Target */}
        {calorieTarget && (
          <div className="space-y-1">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-emerald-500" /> TDEE Target
            </p>
            <p className="text-xl sm:text-2xl font-display font-black text-slate-800">
              {calorieTarget} <span className="text-xs sm:text-sm font-sans font-medium text-slate-500">kcal</span>
            </p>
          </div>
        )}

        {/* Percentage of progression */}
        <div className="col-span-2 sm:col-span-1 space-y-1">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> Calorie Ratio
          </p>
          <p className="text-xl sm:text-2xl font-display font-black text-slate-800">
            {progressPercent.toFixed(0)} <span className="text-xs sm:text-sm font-sans font-medium text-slate-500">%</span>
          </p>
        </div>
      </div>

      {/* Visual meter progress bar */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full overflow-hidden relative" style={{ background: '#2a2a2a' }}>
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Supporting status details */}
        {calorieTarget && (
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <div className={`flex items-center gap-1.5 ${statusText}`}>
              {statusIcon}
              <span>
                {isOverTarget
                   ? `Calorie Excess! (+${totalConsumed - calorieTarget} kcal)`
                   : `Remaining budget today: ${remaining} kcal`
                }
              </span>
            </div>
            <span className="text-slate-400 text-[10px] sm:text-xs font-semibold font-mono">
              {progressPercent < 100 ? `${(100 - progressPercent).toFixed(0)}% Left` : 'Target Met'}
            </span>
          </div>
        )}
      </div>

      {/* Extreme Deficit Protection Alarm Banner */}
      {isExtremeDeficit && totalConsumed > 0 && (
        <div className="mt-4 flex gap-2.5 p-3 rounded-xl items-start" style={{ background: 'rgba(120, 53, 15, 0.3)', border: '1px solid rgba(217, 119, 6, 0.3)' }}>
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-500 mt-0.5" />
          <p className="font-semibold leading-relaxed text-xs text-amber-300">
            Nutrition Warning: Your calorie intake is extremely low (&lt;1200 kcal). Please ensure you get adequate macronutrients to prevent your metabolic rate from slowing down drastically!
          </p>
        </div>
      )}
    </div>
  );
}
