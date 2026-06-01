import { Flame, Zap, Award, CheckCircle2 } from 'lucide-react';

const activityLabels = {
  sedentary: 'Sedentary (Little or no exercise / desk job)',
  light: 'Lightly Active (Light exercise 1-3 times/week)',
  moderate: 'Moderately Active (Active exercise 3-5 times/week)',
  very_active: 'Very Active (Hard exercise 6-7 times/week)',
  extra_active: 'Extra Active (Athlete / heavy daily physical job)',
};

const goalLabels = {
  lose_weight: 'Weight Loss (Deficit)',
  maintain: 'Weight Maintenance (Maintain)',
  gain_weight: 'Weight Gain (Surplus)',
};

const rateLabels = {
  low: 'Gentle (0.25 kg/week)',
  medium: 'Recommended (0.5 kg/week)',
  high: 'Aggressive (1 kg/week)',
};

export default function TdeeResult({ tdee, tdeeRange, calorieTarget, activityLevel, fitnessGoal, calorieRate }) {
  const activityDescription = activityLabels[activityLevel] || activityLevel;
  const goalLabel = goalLabels[fitnessGoal] || fitnessGoal;
  const rateLabel = calorieRate ? rateLabels[calorieRate] : null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-lux space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Total Daily Energy Expenditure (TDEE)
          </p>
          <p className="font-display font-extrabold text-2xl text-slate-800 tracking-tight mt-1">
            {tdeeRange ? `${tdeeRange.min} - ${tdeeRange.max}` : Math.round(tdee)} <span className="text-sm font-sans font-medium text-slate-500 font-mono">kcal/day</span>
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100/60">
          <Flame className="w-5 h-5 animate-pulse" />
        </div>
      </div>

      {activityLevel && (
        <div className="text-xs text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <span>{activityDescription}</span>
        </div>
      )}

      {calorieTarget && (
        <div className="space-y-2 pt-2 border-t border-slate-100/80">
          <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-500" /> Daily Calorie Target
          </p>
          <div className="p-3.5 bg-emerald-500 text-white rounded-xl shadow-sm space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="font-display font-black text-2.5xl tracking-tight font-mono">{calorieTarget}</span>
              <span className="text-xs font-medium opacity-90">kcal / day</span>
            </div>
            <p className="text-xs font-semibold opacity-95">
              Program: {goalLabel} {rateLabel ? `(${rateLabel})` : ''}
            </p>
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-400 font-medium italic mt-2 pt-1 border-t border-slate-50">
        *Energy needs vary based on individual baseline metabolism, daily exercise intensity, and general health metrics.
      </p>
    </div>
  );
}
