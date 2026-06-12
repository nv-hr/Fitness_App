import { Flame, Clock, Apple, Target, Scale, Zap, ShieldCheck, AlertTriangle } from 'lucide-react';
import { MetricItem, Card } from '../../../shared/ui/index.js';

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
    <Card className={cardBg}>
      {/* Grid displaying the various biometrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Active Minutes */}
        <MetricItem icon={<Clock className="w-3.5 h-3.5 text-blue-500" />} label="Workout Duration" value={totalActiveMinutes} unit="mins" />

        {/* Burned */}
        <MetricItem icon={<Flame className="w-3.5 h-3.5 text-orange-500" />} label="Calories Burned" value={totalCaloriesBurned} unit="kcal" />

        {/* Consumed */}
        <MetricItem icon={<Apple className="w-3.5 h-3.5 text-emerald-500" />} label="Logged Meals" value={totalConsumed} unit="kcal" />

        {/* Target */}
        {calorieTarget && (
          <MetricItem icon={<Target className="w-3.5 h-3.5 text-slate-500" />} label="BMR Goal" value={calorieTarget} unit="kcal" />
        )}
      </div>

      {/* Net Calories Analysis Bar */}
      {netVsTarget !== null && netVsTarget !== undefined && (
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${netColor}`}>
          <div className="flex gap-2.5 items-start">
            <div className="mt-0.5">{netIcon}</div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider leading-none text-slate-400">
                {netStatusTitle}
              </p>
              <p className="text-lg sm:text-xl font-display font-black text-white mt-1 leading-none font-mono">
                {netVsTarget > 0 ? `Surplus: +${roundedNetVsTarget}` : `Deficit: -${roundedNetVsTarget}`} <span className="text-xs font-sans font-medium text-slate-500">kcal</span>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 border-current/15 pt-2 sm:pt-0 w-full sm:w-auto">
            <p className="text-[10px] font-semibold uppercase opacity-75 tracking-wider text-slate-400">Daily Net Calories</p>
            <p className="text-sm font-extrabold font-mono font-display mt-0.5 text-white">
              {netCalories} <span className="text-xs font-sans font-normal font-mono text-slate-500">kcal net consumed</span>
            </p>
          </div>
        </div>
      )}

      {!hasActivity && (
        <p className="text-[11px] text-slate-400 font-medium italic mt-3 text-center">
          *You haven't logged any workouts today. The AI week plan suggestions are waiting below.
        </p>
      )}
    </Card>
  );
}
