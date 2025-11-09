import React, { useState, useEffect } from 'react';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Заглушка для уведомлений
    const mockNotifications = [
      { id: 1, message: 'Новая жалоба #156', time: '2 минуты назад', type: 'info' },
      { id: 2, message: 'Жалоба #142 решена', time: '1 час назад', type: 'success' },
      { id: 3, message: 'Требуется ваше внимание: жалоба #138', time: '2 часа назад', type: 'warning' }
    ];
    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => n.type === 'info' || n.type === 'warning').length;

  return (
    <div style={{ position: 'relative' }}>
      <div 
        className="notification-bell"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <span style={{ fontSize: '1.25rem' }}>🔔</span>
        {unreadCount > 0 && (
          <div className="notification-badge">
            {unreadCount}
          </div>
        )}
      </div>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-lg)',
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          <div style={{ 
            padding: '1rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h4 style={{ margin: 0 }}>Уведомления</h4>
            <span style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)' 
            }}>
              {unreadCount} непрочитанных
            </span>
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Нет уведомлений
            </div>
          ) : (
            <div>
              {notifications.map(notification => (
                <div 
                  key={notification.id}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--background)'}
                  onMouseLeave={(e) => e.target.style.background = 'var(--surface)'}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '0.75rem' 
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: notification.type === 'success' ? 'var(--success-color)' : 
                                 notification.type === 'warning' ? 'var(--warning-color)' : 'var(--primary-color)',
                      marginTop: '0.5rem',
                      flexShrink: 0
                    }}></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        margin: '0 0 0.25rem 0',
                        fontSize: '0.875rem',
                        lineHeight: '1.4'
                      }}>
                        {notification.message}
                      </p>
                      <span style={{ 
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)'
                      }}>
                        {notification.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ 
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <button 
              onClick={() => setShowDropdown(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-color)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;