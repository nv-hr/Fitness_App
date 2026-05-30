import { useState, useEffect, useRef } from 'react';

export default function RateLimitedButton({ onClick, isLoading, retryAfter, children }) {
  const [countdown, setCountdown] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (retryAfter != null && retryAfter > 0) {
      setCountdown(retryAfter);
    }
  }, [retryAfter]);

  useEffect(() => {
    if (countdown != null && countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [countdown != null]);

  const isCountingDown = countdown != null && countdown > 0;
  const disabled = isLoading || isCountingDown;

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleClick = () => {
    if (!disabled && onClick) onClick();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '0.75rem 1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        background: isLoading ? '#f3f4f6' : '#f0fdf4',
        border: isLoading ? '1px solid #e5e7eb' : '1px solid #bbf7d0',
        borderRadius: '4px',
        color: isLoading ? '#666' : '#16a34a',
        fontWeight: 'bold',
        fontSize: '0.875rem',
        minHeight: '44px',
      }}
    >
      {isLoading ? 'Regenerating...' : isCountingDown ? `Wait ${formatCountdown(countdown)}` : children}
    </button>
  );
}
