/**
 * useResponsive.js
 *
 * Why: Centralising the mobile-breakpoint check in a single hook avoids
 * multiple components duplicating window-resize listeners and each having
 * their own inconsistent breakpoint values.
 */

import { useState, useEffect } from 'react';

/** Breakpoint below which the layout is considered "mobile". */
const MOBILE_BREAKPOINT = 768;

/**
 * Returns responsive layout flags derived from the window width.
 * Re-renders consumers only when the mobile/desktop boundary is crossed.
 *
 * @returns {{ isMobile: boolean }}
 */
export function useResponsive() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile };
}
