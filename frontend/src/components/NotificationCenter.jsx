import React, { useState, useEffect } from 'react'

export default function NotificationCenter({ notifications = [], onDismiss }) {
  const [visible, setVisible] = useState(notifications.length > 0)

  useEffect(() => {
    setVisible(notifications.length > 0)
  }, [notifications])

  if (!visible || notifications.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      zIndex: 9999,
      maxWidth: '400px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      {notifications.map((notif, idx) => {
        const bgColor = {
          'success': '#d4edda',
          'info': '#d1ecf1',
          'warning': '#fff3cd',
          'critical': '#f8d7da'
        }[notif.type] || '#d1ecf1'

        const borderColor = {
          'success': '#28a745',
          'info': '#17a2b8',
          'warning': '#ffc107',
          'critical': '#dc3545'
        }[notif.type] || '#17a2b8'

        return (
          <div
            key={idx}
            style={{
              backgroundColor: bgColor,
              border: `2px solid ${borderColor}`,
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '1rem' }}>
                  {notif.icon} {notif.message}
                </p>
                {notif.details && (
                  <p style={{ margin: '0', fontSize: '0.85rem', opacity: 0.8 }}>
                    {notif.details}
                  </p>
                )}
              </div>
              <button
                onClick={() => onDismiss && onDismiss(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0',
                  marginLeft: '0.5rem'
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )
      })}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
