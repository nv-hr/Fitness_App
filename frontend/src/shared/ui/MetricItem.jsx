import React from 'react';

/**
 * MetricItem
 * Semantic component for displaying a single fitness metric.
 * Eliminates duplicate metric cell implementations across summary panels.
 * 
 * @param {Object} props
 * @param {React.ReactElement} props.icon - lucide-react icon element, pre-sized
 * @param {string} props.label - ALL-CAPS label text
 * @param {number|string} props.value - Primary numeric value
 * @param {string} props.unit - Unit suffix
 * @param {string} [props.className] - Additional classes for wrapper
 */
const MetricItem = ({ icon, label, value, unit, className = '' }) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-xl sm:text-2xl font-display font-black text-white">
        {value} <span className="text-xs sm:text-sm font-sans font-medium text-slate-500">{unit}</span>
      </p>
    </div>
  );
};

export default MetricItem;
