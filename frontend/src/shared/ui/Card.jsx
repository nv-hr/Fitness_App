import React from 'react';

/**
 * Card
 * Primitive layout container.
 * Standardizes the card container used in summary panels and prevents className drift.
 * 
 * @param {Object} props
 * @param {string} [props.className] - Additional/override classes merged after base
 * @param {React.ReactNode} props.children - Slot content
 */
const Card = ({ className = '', children }) => {
  return (
    <div className={`p-6 rounded-2xl border transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
