import { Flame, Clock, Apple, Target, Scale, Zap, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function ActivitySummary({ summary }) {
  if (!summary) {
    return null;
  }

  const { totalActiveMinutes, totalCaloriesBurned, totalConsumed, calorieTarget, netCalories, netVsTarget } = summary;
  const hasActivity = totalActiveMinutes > 0 || totalCaloriesBurned > 0;

  // Design parameters based on Net vs Target
  let netColor = 'text-red-400 bg-red-950/40 border-red-900/30';
  let netIcon = <ShieldCheck className="w-5 h-5 text-red-500" />;
  let netStatusTitle = 'Healthy Deficit Monitored';
  let cardBg = 'bg-[#1a1a1a] border-[#2d2d2d] shadow-lux';

  if (netVsTarget !== null && netVsTarget !== undefined) {
    if (netVsTarget > 0) {
      netColor = 'text-amber-400 bg-amber-950/40 border-amber-900/30';
      netIcon = <AlertTriangle className="w-5 h-5 text-amber-500" />;
      netStatusTitle = 'Suggested: Add Workout';
      cardBg = 'bg-[#1a1a1a] border-[#2d2d2d] shadow-lux';
    } else if (netVsTarget < 0) {
      netColor = 'text-red-400 bg-red-950/40 border-red-900/30';
      netIcon = <ShieldCheck className="w-5 h-5 text-red-500" />;
      netStatusTitle = 'Deficit Goal Met (Good!)';
    }
  }

  const roundedNetVsTarget = Math.abs(netVsTarget || 0);

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-300 ${cardBg}`}>
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100/80 pb-2 mb-4 flex items-center justify-between">
        <span>Daily Activity Metrics</span>
        <span className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono font-bold">
          LIVE METRICS
        </span>
      </h4>

      {/* Grid displaying the various biometrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Active Minutes */}
        <div className="bg-slate-50/60 border border-slate-100 p-3.5 rounded-xl space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" /> Workout Duration
          </p>
          <p className="text-lg font-display font-black text-slate-800">
            {totalActiveMinutes} <span className="text-xs font-sans font-medium text-slate-500 font-mono">mins</span>
          </p>
        </div>

        {/* Burned */}
        <div className="bg-slate-50/60 border border-slate-100 p-3.5 rounded-xl space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" /> Calories Burned
          </p>
          <p className="text-lg font-display font-black text-slate-800">
            {totalCaloriesBurned} <span className="text-xs font-sans font-medium text-slate-500 font-mono">kcal</span>
          </p>
        </div>

        {/* Consumed */}
        <div className="bg-slate-50/60 border border-slate-100 p-3.5 rounded-xl space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Apple className="w-3.5 h-3.5 text-emerald-500" /> Logged Meals
          </p>
          <p className="text-lg font-display font-black text-slate-800">
            {totalConsumed} <span className="text-xs font-sans font-medium text-slate-500 font-mono">kcal</span>
          </p>
        </div>

        {/* Target */}
        {calorieTarget && (
          <div className="bg-slate-50/60 border border-slate-100 p-3.5 rounded-xl space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-slate-500" /> BMR Goal
            </p>
            <p className="text-lg font-display font-black text-slate-800">
              {calorieTarget} <span className="text-xs font-sans font-medium text-slate-500 font-mono">kcal</span>
            </p>
          </div>
        )}
      </div>

      {/* Net Calories Analysis Bar */}
      {netVsTarget !== null && netVsTarget !== undefined && (
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${netColor}`}>
          <div className="flex gap-2.5 items-start">
            <div className="mt-0.5">{netIcon}</div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider leading-none">
                {netStatusTitle}
              </p>
              <p className="text-lg sm:text-xl font-display font-black text-slate-855 mt-1 leading-none font-mono">
                {netVsTarget > 0 ? `Surplus: +${roundedNetVsTarget}` : `Deficit: -${roundedNetVsTarget}`} <span className="text-xs font-sans font-medium">kcal</span>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 border-current/15 pt-2 sm:pt-0 w-full sm:w-auto">
            <p className="text-[10px] font-semibold uppercase opacity-75 tracking-wider">Daily Net Calories</p>
            <p className="text-sm font-extrabold font-mono font-display mt-0.5">
              {netCalories} <span className="text-xs font-sans font-normal font-mono">kcal net consumed</span>
            </p>
          </div>
        </div>
      )}

      {!hasActivity && (
        <p className="text-[11px] text-slate-400 font-medium italic mt-3 text-center">
          *You haven't logged any workouts today. The AI week plan suggestions are waiting below.
        </p>
      )}
    </div>
  );
}
