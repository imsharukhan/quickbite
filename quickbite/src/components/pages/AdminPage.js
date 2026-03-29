'use client';
import { useState, useEffect } from 'react';
import api from '@/services/api';

export default function AdminPage() {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState('stats');
    
    // Auth Check
    useEffect(() => {
        const stored = sessionStorage.getItem('qb_admin_key');
        if (stored) {
            setPassword(stored);
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        sessionStorage.setItem('qb_admin_key', password);
        setIsAuthenticated(true);
    };

    if (!isAuthenticated) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
               <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                   <h2 style={{ marginBottom: '20px' }}>Admin Access</h2>
                   <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                       <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter Admin Secret" style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
                       <button type="submit" style={{ padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Unlock Panel</button>
                   </form>
               </div>
            </div>
        );
    }

    // Dummy API fetchers structure since backend admin routes vary, we assume exact mapping
    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Admin Dashboard</h1>
                <button onClick={() => { sessionStorage.removeItem('qb_admin_key'); window.location.reload(); }} style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
                {['stats', 'vendors', 'outlets', 'orders'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '8px 16px', background: activeTab === t ? '#333' : 'transparent', color: activeTab === t ? 'white' : '#333', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>{t}</button>
                ))}
            </div>

            {activeTab === 'stats' && (
                <div>
                   <h2 style={{ marginBottom: '16px' }}>Platform Statistics</h2>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                       <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><h3>Users</h3><p style={{ fontSize: '2rem', fontWeight: 800 }}>--</p></div>
                       <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><h3>Vendors</h3><p style={{ fontSize: '2rem', fontWeight: 800 }}>--</p></div>
                       <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><h3>Revenue Today</h3><p style={{ fontSize: '2rem', fontWeight: 800, color: '#FC8019' }}>--</p></div>
                   </div>
                </div>
            )}

            {activeTab === 'vendors' && (
                <div>
                   <h2 style={{ marginBottom: '16px' }}>Manage Vendors</h2>
                   <p style={{ color: '#666' }}>Requires backend GET /api/admin/vendors with X-Admin-Key integration.</p>
                </div>
            )}
            
            {activeTab !== 'stats' && activeTab !== 'vendors' && (
                <div>
                   <h2 style={{ marginBottom: '16px', textTransform: 'capitalize' }}>Manage {activeTab}</h2>
                   <p style={{ color: '#666' }}>Integration endpoint reserved.</p>
                </div>
            )}
        </div>
    );
}
