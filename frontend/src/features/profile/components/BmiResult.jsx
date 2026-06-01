import { Activity } from 'lucide-react';

const categoryColors = {
  underweight: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200/60',
    indicator: 'bg-blue-500',
    text: 'text-blue-600',
    label: 'Underweight',
  },
  normal: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    indicator: 'bg-emerald-500',
    text: 'text-emerald-600',
    label: 'Healthy Weight',
  },
  overweight: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200/60',
    indicator: 'bg-amber-500',
    text: 'text-amber-600',
    label: 'Overweight',
  },
  obese: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200/60',
    indicator: 'bg-rose-500',
    text: 'text-rose-600',
    label: 'Obese',
  },
};

export default function BmiResult({ bmi, bmiCategory }) {
  const meta = categoryColors[bmiCategory] || {
    bg: 'bg-slate-50 text-slate-700 border-slate-200/60',
    indicator: 'bg-slate-500',
    text: 'text-slate-600',
    label: bmiCategory,
  };

  // Calculate percentage for a subtle graphical scale representation (ranges from 15 to 35 for safety display)
  const rangeMin = 15;
  const rangeMax = 35;
  const displayPercentage = Math.min(Math.max(((bmi - rangeMin) / (rangeMax - rangeMin)) * 100, 5), 95);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-lux space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Body Mass Index (BMI)
          </p>
          <p className="font-display font-extrabold text-4xl text-slate-800 tracking-tight mt-1">
            {bmi.toFixed(1)}
          </p>
        </div>
        <div className={`p-2.5 rounded-xl border ${meta.bg}`}>
          <Activity className="w-5 h-5" />
        </div>
      </div>

      {/* Category Tag */}
      <div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${meta.bg}`}>
          {meta.label}
        </span>
      </div>

      {/* Subtle Visual Scale Indicator */}
      <div className="space-y-1.5 pt-1">
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
          <div 
            className={`h-full ${meta.indicator} rounded-full transition-all duration-500`}
            style={{ width: `${displayPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-medium font-mono">
          <span>15.0</span>
          <span>18.5 (Normal)</span>
          <span>25.0 (Overweight)</span>
          <span>35.0</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 font-medium italic mt-2">
        *This evaluation is a standard biometric estimate and is not formal medical advice.
      </p>
    </div>
  );
}
