import { useRef, useEffect, useCallback } from 'react';

/**
 * A robust exponential backoff polling hook.
 *
 * @param {Function} pollFn - Async function that resolves with true when polling should stop, false otherwise.
 * @param {Object} options - Polling options
 * @param {number} [options.initialDelay=3000] - Initial delay in ms
 * @param {number} [options.maxAttempts=5] - Maximum number of polling attempts
 * @param {number} [options.factor=1.5] - Exponential factor
 * @param {Function} [options.onTimeout] - Callback if maxAttempts is reached without success
 * @returns {Function} Function to start polling
 */
export function usePollingWithBackoff(pollFn, options = {}) {
  const { initialDelay = 3000, maxAttempts = 5, factor = 1.5, onTimeout } = options;
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startPolling = useCallback((...args) => {
    let attempts = 0;
    let delay = initialDelay;

    const executePoll = async () => {
      if (!mountedRef.current) return;
      attempts++;

      try {
        const success = await pollFn(...args);
        if (success) {
          // Polling succeeded and should stop
          return;
        }
      } catch (err) {
        // Ignored, just retry
      }

      if (attempts >= maxAttempts) {
        if (onTimeout) onTimeout();
      } else {
        if (!mountedRef.current) return;
        delay = Math.floor(delay * factor);
        timeoutRef.current = setTimeout(executePoll, delay);
      }
    };

    // Clear any existing polling
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(executePoll, delay);
  }, [pollFn, initialDelay, maxAttempts, factor, onTimeout]);

  return startPolling;
}
