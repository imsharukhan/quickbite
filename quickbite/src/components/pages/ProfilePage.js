'use client';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage({ navigate }) {
  const { user, role, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="profile-page pb-section">
      <div className="menu-header" style={{ marginBottom: '20px' }}>
        <div className="menu-header-info">
          <h1>Profile</h1>
          <p>Manage your account</p>
        </div>
      </div>

      <div className="profile-header">
        <div className="profile-avatar">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{user?.name || 'Loading...'}</h2>
          <p className="profile-email">{user?.email || 'No email added'}</p>
          <div className="profile-tags">
            <span className="tag">{role === 'student' ? 'Student' : 'Vendor'}</span>
            <span className="tag">{user?.register_number || user?.id?.substring(0,8)}</span>
          </div>
        </div>
      </div>

      <div className="profile-details-card">
        <div className="detail-row">
          <span className="detail-label">Role</span>
          <span className="detail-value" style={{ textTransform: 'capitalize' }}>{role}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Department</span>
          <span className="detail-value">Not set</span>
        </div>
      </div>

      <div className="profile-section">
        <h3>Quick Links</h3>
        <div className="quick-links">
          <button className="link-item" onClick={() => navigate('orders')}>
            <span className="link-icon">🧾</span>
            <span>My Orders</span>
            <span className="link-arrow">→</span>
          </button>
          <button className="link-item">
            <span className="link-icon">⚙️</span>
            <span>Settings</span>
            <span className="link-arrow">→</span>
          </button>
          <button className="link-item">
            <span className="link-icon">❓</span>
            <span>Help & Support</span>
            <span className="link-arrow">→</span>
          </button>
        </div>
      </div>

      <button className="btn btn-outline btn-block" onClick={handleLogout} style={{ color: 'var(--red)', borderColor: 'var(--red)', marginTop: '20px' }}>
        Log Out
      </button>
    </div>
  );
}
