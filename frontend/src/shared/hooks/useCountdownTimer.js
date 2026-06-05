/**
 * useCountdownTimer.js
 *
 * Why: The setInterval-based countdown pattern (decrement state by 1 each
 * second, stop at 0, clear on unmount) was duplicated for both `genRetryAfter`
 * and `swapRetryAfter` in both calendar sections — four copies total.
 * This hook owns that logic once.
 */

import { useState, useEffect } from 'react';

/**
 * Manages a countdown timer that ticks down from an initial value to zero.
 * Returns the current remaining seconds and a setter to (re)start the timer.
 *
 * @param {number|null} initialSeconds - Starting value in seconds, or null to be inactive.
 * @returns {{ remaining: number|null, setRemaining: Function }}
 */
export function useCountdownTimer(initialSeconds = null) {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (remaining == null || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining]);

  return { remaining, setRemaining };
}
