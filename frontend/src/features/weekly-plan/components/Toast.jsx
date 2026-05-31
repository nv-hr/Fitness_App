import { useEffect } from 'react'

const TYPE_STYLES = {
  success: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
  },
  info: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1e40af',
  },
}

export default function Toast({ message, type = 'error', onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss()
    }, 6000)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  const typeStyle = TYPE_STYLES[type] || TYPE_STYLES.error

  return (
    <div
      onClick={onDismiss}
      role="alert"
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        maxWidth: '400px',
        width: 'calc(100% - 32px)',
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        fontSize: '0.875rem',
        lineHeight: 1.5,
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '8px',
        ...typeStyle,
      }}
    >
      <span>{message}</span>
      <span style={{ fontSize: '16px', flexShrink: 0, lineHeight: 1 }}>
        ✕
      </span>
    </div>
  )
}
