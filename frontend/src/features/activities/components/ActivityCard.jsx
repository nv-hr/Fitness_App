import { Flame, Clock, Dumbbell, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function ActivityCard({ activity, onLogClick, isLogging }) {
  const equips = activity.equipment_needed && activity.equipment_needed.length > 0
    ? activity.equipment_needed.join(', ')
    : 'No Equipment';

  return (
    <div className="bg-slate-50/60 p-4.5 rounded-2xl border border-slate-200/50 hover:border-emerald-200 hover:bg-slate-50 transition-all duration-200 shadow-xs relative overflow-hidden group mb-4">
      <div className="space-y-1.5 relative z-10">
        <h4 className="font-display font-bold text-base text-slate-800 tracking-tight group-hover:text-emerald-700 transition-colors">
          {activity.name}
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
          {activity.description}
        </p>

        {/* Info badges layout */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-600 font-mono">
          <span className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" /> {activity.duration_min} mins
          </span>
          <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg px-2.5 py-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" /> {activity.estimated_calories} kcal
          </span>
        </div>

        {/* Equipment needed section */}
        <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5 pt-1">
          <Dumbbell className="w-3.5 h-3.5 text-slate-400" />
          <span>Equipment: <strong className="text-slate-600 font-semibold">{equips}</strong></span>
        </div>

        {/* Save button block */}
        {onLogClick && (
          <div className="pt-3 border-t border-slate-100/60 mt-3 flex justify-end">
            <button
              onClick={() => onLogClick(activity)}
              disabled={isLogging}
              className={`w-full sm:w-auto flex items-center justify-center gap-1 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all border cursor-pointer active:scale-95 ${
                isLogging
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-100/60'
              }`}
            >
              {isLogging ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mr-1"></div>
                  Logging...
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-500" /> Log This Workout
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
