'use client';
import { useApp } from '@/context/AppContext';

export default function NotificationsPage({ navigate }) {
  const { notifications, markNotificationRead, markAllNotificationsRead, isNotifsLoading } = useApp();

  if (isNotifsLoading && notifications.length === 0) {
      return (
        <div className="empty-state" style={{ height: '100vh' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px', borderColor: 'var(--primary-light)', borderTopColor: 'var(--primary)' }}></div>
        </div>
      );
  }

  return (
    <div className="notifications-page pb-section">
      <div className="menu-header" style={{ marginBottom: '20px' }}>
        <div className="menu-header-info">
          <h1>Notifications</h1>
          <p>Stay updated on your orders</p>
        </div>
        {notifications.length > 0 && (
          <button className="text-btn" onClick={markAllNotificationsRead} style={{ color: 'var(--primary)' }}>
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <h3>All caught up!</h3>
          <p>You have no new notifications.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notif => (
            <div 
              key={notif.id} 
              className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
              onClick={() => {
                if (!notif.is_read) markNotificationRead(notif.id);
                if (notif.related_order_id && navigate) navigate('orders');
              }}
              style={{ cursor: notif.related_order_id ? 'pointer' : 'default' }}
            >
              <div className="notif-icon">
                {notif.message.toLowerCase().includes('ready') ? '🍽️' : 
                 notif.message.toLowerCase().includes('confirmed') ? '✅' : '🔔'}
              </div>
              <div className="notif-content">
                <p>{notif.message} {notif.related_order_id && <span style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 'bold' }}> → View Order</span>}</p>
                <span className="notif-time">{new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              {!notif.is_read && <div className="unread-dot"></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
