import ActivityCard from './ActivityCard.jsx';
import { Library } from 'lucide-react';

/**
 * @param {object}   props
 * @param {object[]} props.activities  - Full list of available activities.
 * @param {Function} props.onLogClick  - Called with the activity object when Log is clicked.
 * @param {object|null} props.isLogging - The activity currently open in the log form (or null).
 */
export default function ActivityPool({ activities, onLogClick, isLogging }) {
  // True when any log form is open — used to disable all other cards' Log buttons
  const anyLogging = !!isLogging;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/50 shadow-sm space-y-4">
      <div className="border-b border-slate-50 pb-2.5 flex justify-between items-center">
        <h3 className="font-display font-bold text-sm text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
          <Library className="w-4 h-4 text-emerald-500" />
          KalaFit Workout Library
        </h3>
        <span className="text-xs font-bold text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
          {activities.length} Total
        </span>
      </div>

      <p className="text-[11px] text-slate-450 leading-relaxed text-slate-400">
        Choose a custom physical workout from our biometric exercise library to log manually.
      </p>

      <div className="max-h-96 overflow-y-auto pr-1 space-y-1">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onLogClick={onLogClick}
            isLogging={isLogging?.id === activity.id}
            anyLogging={anyLogging}
          />
        ))}
      </div>
    </div>
  );
}
