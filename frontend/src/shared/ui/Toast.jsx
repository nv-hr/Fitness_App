/**
 * Toast.jsx
 *
 * Why: The error-toast markup was copy-pasted verbatim in MealCalendarSection
 * and ActivityCalendarSection. Extracting it ensures visual consistency and
 * lets both consumers dismiss the toast through the same interface.
 */

import { X, AlertCircle } from 'lucide-react';

/**
 * Fixed-position error toast notification displayed in the top-right corner.
 *
 * @param {object}   props
 * @param {string}   props.message  - The error text to display.
 * @param {Function} props.onClose  - Called when the user clicks the dismiss button.
 * @returns {JSX.Element}
 */
export default function Toast({ message, onClose }) {
  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-[#1e1e1e] border border-rose-900/40 p-4 rounded-xl shadow-elevated text-sm text-slate-200 max-w-sm animate-slide-in">
      <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
      <p className="font-semibold text-xs leading-relaxed flex-1">{message}</p>
      <button
        onClick={onClose}
        className="p-1 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
