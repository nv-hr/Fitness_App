/**
 * Toast.jsx
 *
 * Why: The error-toast markup was copy-pasted verbatim in MealCalendarSection
 * and ActivityCalendarSection. Extracting it ensures visual consistency and
 * lets both consumers dismiss the toast through the same interface.
 */

import { useEffect, useRef } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

const TYPE_STYLES = {
  error: {
    border: 'border-rose-900/40',
    icon: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
  },
  success: {
    border: 'border-emerald-900/40',
    icon: <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
  },
  info: {
    border: 'border-blue-900/40',
    icon: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
  },
};

/**
 * Fixed-position toast notification displayed in the top-right corner.
 *
 * @param {object}   props
 * @param {string}   props.message  - The text to display.
 * @param {string}   [props.type="error"] - "error", "success", or "info".
 * @param {Function} [props.onClose]  - Called when dismissed or auto-closed.
 * @param {Function} [props.onDismiss] - Legacy alias for onClose.
 * @returns {JSX.Element}
 */
export default function Toast({ message, type = 'error', onClose, onDismiss }) {
  const handleClose = onClose || onDismiss;
  const onCloseRef = useRef(handleClose);
  onCloseRef.current = handleClose;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof onCloseRef.current === 'function') onCloseRef.current();
    }, 6000);
    return () => clearTimeout(timer);
  }, [message]);

  const styleConfig = TYPE_STYLES[type] || TYPE_STYLES.error;

  return (
    <div 
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 bg-[#1e1e1e] border ${styleConfig.border} p-4 rounded-xl shadow-elevated text-sm text-slate-200 max-w-sm animate-slide-in cursor-pointer`}
      onClick={handleClose}
      role="alert"
    >
      {styleConfig.icon}
      <p className="font-semibold text-xs leading-relaxed flex-1">{message}</p>
      <button
        onClick={(e) => { e.stopPropagation(); if (handleClose) handleClose(); }}
        className="p-1 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
