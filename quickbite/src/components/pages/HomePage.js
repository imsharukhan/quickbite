'use client';
import { useState, useEffect } from 'react';
import * as outletService from '@/services/outletService';

export default function HomePage({ navigate }) {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOutlets = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await outletService.getAllOutlets();
      setOutlets(data || []);
    } catch (err) {
      setError('Failed to fetch outlets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  return (
    <div className="home-page pb-section">
      <div className="search-section" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'url("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="greeting">Cravings? Fast.</h1>
          <p className="subtitle">Pre-order from campus cafeterias</p>
          <div className="search-bar">
            <span>🔍</span>
            <input type="text" placeholder="Search food, outlets..." />
          </div>
        </div>
      </div>
      <div className="section-header">
        <h2>Campus Outlets</h2>
        <span className="see-all">See All</span>
      </div>
      <div className="outlets-list">
        {loading ? (
          <>
            <div className="skeleton skeleton-card" style={{ height: '220px', borderRadius: 'var(--radius-lg)' }} />
            <div className="skeleton skeleton-card" style={{ height: '220px', borderRadius: 'var(--radius-lg)' }} />
            <div className="skeleton skeleton-card" style={{ height: '220px', borderRadius: 'var(--radius-lg)' }} />
          </>
        ) : error ? (
          <div className="empty-state">
            <p>{error}</p>
            <button className="btn btn-outline" onClick={fetchOutlets} style={{ marginTop: '10px' }}>Retry</button>
          </div>
        ) : (
          outlets.map(o => (
            <div key={o.id} className="outlet-card" onClick={() => navigate('menu', o)}>
              <div className="outlet-image-placeholder">
                <span style={{ fontSize: '2rem' }}>🍔</span>
              </div>
              <div className="outlet-info">
                <div className="outlet-name-row">
                  <h3 className="outlet-name">{o.name}</h3>
                  <span className="rating">⭐ {o.rating}</span>
                </div>
                <p className="outlet-cuisine">{o.cuisine}</p>
                <div className="outlet-meta">
                  <span className={`status ${o.is_open ? 'open' : 'closed'}`}>{o.is_open ? 'Open' : 'Closed'}</span>
                  <span className="delivery-time">📍 {o.vendor_name || 'Campus'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
