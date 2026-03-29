'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import * as outletManagementService from '@/services/outletManagementService';
import * as orderSvc from '@/services/orderService';
import * as menuMgmt from '@/services/menuManagementService';
import { useWebSocket } from '@/hooks/useWebSocket';
import { CheckCircle, Clock, PackageCheck, AlertCircle, IndianRupee, Eye, EyeOff } from 'lucide-react';

export default function VendorDashboard({ showToast }) {
    const { user } = useAuth();
    
    const [outlets, setOutlets] = useState([]);
    const [selectedOutlet, setSelectedOutlet] = useState(null);
    const [orders, setOrders] = useState([]);
    const [menu, setMenu] = useState([]);
    const [stats, setStats] = useState({ total_orders: 0, active_orders: 0, preparing_orders: 0, revenue_today: 0, completed_today: 0 });
    
    const [activeTab, setActiveTab] = useState('orders'); // orders, menu, outlet
    const [filterStatus, setFilterStatus] = useState('all');
    
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [revenueVisible, setRevenueVisible] = useState(true);
    
    // Add new item form state
    const [showAddItem, setShowAddItem] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category: '', is_veg: true, is_bestseller: false });

    // WebSockets via our new hook
    const { lastMessage } = useWebSocket('vendor', user?.id);

    useEffect(() => {
        if (!user) return;
        outletManagementService.getMyOutlets().then(data => {
            const myOutlets = data.filter(o => o.vendor_id === user.id);
            setOutlets(myOutlets);
            if (myOutlets.length > 0) {
                setSelectedOutlet(myOutlets[0]);
            } else {
                setLoading(false);
            }
        });
    }, [user]);

    const loadOutletData = async () => {
        if (!selectedOutlet) return;
        setLoading(true);
        try {
            const [oData, mData, sData] = await Promise.all([
                orderSvc.getOutletOrders(selectedOutlet.id),
                menuMgmt.getFullMenu(selectedOutlet.id),
                orderSvc.getOutletStats(selectedOutlet.id).catch(() => stats)
            ]);
            setOrders(oData || []);
            setMenu(mData || []);
            if (sData) setStats(sData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadOutletData(); }, [selectedOutlet]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (selectedOutlet) {
                orderSvc.getOutletStats(selectedOutlet.id).then(sData => { if(sData) setStats(sData); }).catch(()=>{});
            }
        }, 60000);
        return () => clearInterval(interval);
    }, [selectedOutlet]);

    useEffect(() => {
        if (lastMessage) {
            if (lastMessage.type === 'NEW_ORDER') {
                try { new Audio('/notification.mp3').play().catch(()=>{}); } catch(e){}
                setOrders(prev => [lastMessage.order, ...prev]);
                showToast(`New order received! Token #${lastMessage.order.id.slice(-3)}`, 'success');
                // Refresh stats
                if (selectedOutlet) orderSvc.getOutletStats(selectedOutlet.id).then(sData => { if(sData) setStats(sData); }).catch(()=>{});
            } else if (lastMessage.type === 'STATUS_UPDATE') {
                loadOutletData(); // Heavy but keeps it strictly in sync
            }
        }
    }, [lastMessage]);

    if (!loading && outlets.length === 0) {
        return (
            <div className="empty-state" style={{ height: '100vh' }}>
                <h3>Contact admin to set up your outlet</h3>
                <p>No outlets are currently assigned to your vendor account.</p>
            </div>
        );
    }

    const handleOrderAction = async (orderId, newStatus, currentStatus) => {
        setActionLoading(orderId);
        try {
            if (currentStatus === 'Placed') {
                await orderSvc.confirmPayment(orderId);
            } else {
                await orderSvc.updateOrderStatus(orderId, newStatus);
            }
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, payment_status: currentStatus === 'Placed' ? 'PAID' : o.payment_status } : o));
            showToast('Order updated');
            if (selectedOutlet) orderSvc.getOutletStats(selectedOutlet.id).then(sData => { if(sData) setStats(sData); }).catch(()=>{});
        } catch(e) {
            showToast('Failed to update order', 'error');
        } finally {
            setActionLoading(null);
        }
    };
    
    const handleCancelOrder = async (orderId) => {
        setActionLoading(orderId);
        try {
            await orderSvc.cancelOrderVendor(orderId, "Vendor cancelled");
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o));
            showToast('Order cancelled', 'error');
        } catch(e) {
            showToast('Failed to cancel', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleMenu = async (itemId) => {
        try {
            await menuMgmt.toggleAvailability(itemId);
            setMenu(prev => prev.map(m => m.id === itemId ? {...m, is_available: !m.is_available} : m));
            showToast('Item availability updated');
        } catch(e) {
            showToast('Failed to update item', 'error');
        }
    };

    const handleSaveNewItem = async () => {
        try {
            const added = await menuMgmt.addMenuItem(selectedOutlet.id, { ...newItem, price: parseFloat(newItem.price) });
            setMenu([...menu, added]);
            setShowAddItem(false);
            setNewItem({ name: '', description: '', price: '', category: '', is_veg: true, is_bestseller: false });
            showToast('Item added successfully');
        } catch(e) {
            showToast('Failed to add item', 'error');
        }
    };

    const handleToggleOutlet = async () => {
        try {
            const updated = await outletManagementService.toggleOutletOpen(selectedOutlet.id);
            setSelectedOutlet(prev => ({...prev, is_open: updated.is_open}));
            setOutlets(prev => prev.map(o => o.id === updated.id ? {...o, is_open: updated.is_open} : o));
            showToast(`Outlet is now ${updated.is_open ? 'OPEN' : 'CLOSED'}`);
        } catch(e) {
            showToast('Failed to update outlet status', 'error');
        }
    };

    const getNextAction = (status) => {
        switch (status) {
            case 'Placed': return { label: '✅ Confirm Payment', newStatus: 'Preparing', className: 'btn-accept', bg: '#4CAF50' };
            case 'Preparing': return { label: '🔔 Mark Ready', newStatus: 'Ready for Pickup', className: 'btn-ready', bg: '#FC8019' };
            case 'Ready for Pickup': return { label: '✓ Complete', newStatus: 'Picked Up', className: 'btn-complete', bg: '#2E7D32' };
            default: return null;
        }
    };

    const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

    return (
        <div className="page-container vendor-dashboard pb-section">
            <div className="menu-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="menu-header-info" style={{ flex: 1 }}>
                    {outlets.length > 1 ? (
                        <select 
                            value={selectedOutlet?.id || ''} 
                            onChange={(e) => setSelectedOutlet(outlets.find(o => o.id === e.target.value))}
                            style={{ padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '1rem', fontWeight: 700, width: '100%', maxWidth: '300px' }}
                        >
                            {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    ) : (
                        <h1 style={{ fontSize: '1.4rem' }}>{selectedOutlet?.name || 'Dashboard'}</h1>
                    )}
                </div>
            </div>

            <div className="vendor-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                <div className="stat-card"><div className="stat-value">{stats.orders_today}</div><div className="stat-label">Total Today</div></div>
                <div className="stat-card"><div className="stat-value">{stats.active_orders}</div><div className="stat-label">Active</div></div>
                <div className="stat-card"><div className="stat-value">{stats.preparing_orders}</div><div className="stat-label">Preparing</div></div>
                <div className="stat-card">
                    <div className="stat-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        {revenueVisible ? <><IndianRupee size={16}/>{stats.revenue_today}</> : "₹***"}
                        <button onClick={() => setRevenueVisible(!revenueVisible)} style={{ background: 'none', border: 'none', padding: '0', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '4px' }}>
                            {revenueVisible ? <EyeOff size={14}/> : <Eye size={14}/>}
                        </button>
                    </div>
                    <div className="stat-label">Revenue</div>
                </div>
            </div>

            <div className="dashboard-tabs">
                <div className={`dashboard-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Orders</div>
                <div className={`dashboard-tab ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>Menu</div>
                <div className={`dashboard-tab ${activeTab === 'outlet' ? 'active' : ''}`} onClick={() => setActiveTab('outlet')}>My Outlet</div>
            </div>

            {loading ? (
                 <div><div className="skeleton skeleton-card" /><div className="skeleton skeleton-card" /></div>
            ) : activeTab === 'orders' ? (
                <>
                    <div className="filter-tabs" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px' }}>
                        {[{l: 'All', v: 'all'}, {l: 'New', v: 'Placed'}, {l: 'Preparing', v: 'Preparing'}, {l: 'Ready', v: 'Ready for Pickup'}, {l: 'Completed', v: 'Picked Up'}].map(f => (
                            <button key={f.v} className={`filter-tab ${filterStatus === f.v ? 'active' : ''}`} onClick={() => setFilterStatus(f.v)} style={{ whiteSpace: 'nowrap' }}>{f.l}</button>
                        ))}
                    </div>

                    {filteredOrders.length === 0 ? (
                        <div className="empty-state" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}><PackageCheck size={48} style={{ opacity: 0.3 }} /><h3 style={{ margin: '16px 0 8px' }}>No orders found</h3></div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {filteredOrders.map(order => {
                                const action = order.status !== 'Cancelled' && order.status !== 'Picked Up' ? getNextAction(order.status) : null;
                                const isLoading = actionLoading === order.id;
                                
                                const minsWaiting = order.status === 'Placed' ? Math.floor((new Date() - new Date(order.placed_at)) / 60000) : 0;
                                const isGhost = minsWaiting > 20;

                                return (
                                    <div key={order.id} className="vendor-order-card" style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid var(--border-light)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '2px solid var(--border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ background: 'var(--primary-bg)', border: '2px solid var(--primary)', borderRadius: 'var(--radius)', padding: '8px 14px', textAlign: 'center', minWidth: '70px' }}>
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>Token</div>
                                                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>#{order.token_number || order.id?.toString().slice(-3) || '---'}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{order.student_name || 'Student'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reg: {order.student_register_number || order.studentId || order.id?.slice(0,8)}</div>
                                                </div>
                                            </div>
                                            <span style={{ fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--radius)', background: 'var(--bg)', border: '1px solid var(--border)' }}>{order.status}</span>
                                        </div>
                                        {order.payment_status === 'PENDING' ? (
                                            <div style={{ background: '#FFF8E1', color: '#F57F17', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                ⏳ Payment Pending - Waiting for UPI transfer
                                            </div>
                                        ) : order.payment_status === 'PAID' || order.payment_status === 'COMPLETED' ? (
                                            <div style={{ background: '#E8F5E9', color: '#2E7D32', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                ✅ Payment Confirmed
                                            </div>
                                        ) : null}

                                        <div style={{ padding: '12px 0', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', marginBottom: '12px' }}>
                                            {order.items?.map(i => (
                                                <div key={i.id || Math.random()} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                                                    <span>{i.quantity} x {i.name}</span>
                                                    <span style={{ fontWeight: 600 }}>₹{i.price * i.quantity}</span>
                                                </div>
                                            ))}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #eee' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.pickup_time || 'ASAP'}</span>
                                                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>₹{order.total}</span>
                                            </div>
                                        </div>

                                        {isGhost && <div style={{ fontSize: '0.8rem', color: 'var(--red)', fontWeight: 600, marginBottom: '8px', textAlign: 'center' }}>Waiting {minsWaiting}m - confirm payment or cancel</div>}

                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                            {order.status === 'Placed' && (
                                                <button 
                                                    onClick={() => handleCancelOrder(order.id)} 
                                                    disabled={isLoading}
                                                    style={{ padding: '8px 16px', background: '#ffebee', color: '#d84315', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, flex: 1 }}
                                                    className={isGhost ? 'pulse-red' : ''}
                                                >
                                                    ❌ Cancel
                                                </button>
                                            )}
                                            {action && (
                                                <button 
                                                    onClick={() => handleOrderAction(order.id, action.newStatus, order.status)} 
                                                    disabled={isLoading}
                                                    style={{ padding: '8px 16px', background: action.bg, color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                                >
                                                    {isLoading ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}/> : action.label}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : activeTab === 'menu' ? (
                <div>
                    <button className="btn btn-primary btn-block" style={{ marginBottom: '16px' }} onClick={() => setShowAddItem(!showAddItem)}>
                        {showAddItem ? 'Cancel' : '+ Add New Item'}
                    </button>
                    
                    {showAddItem && (
                        <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '20px' }}>
                            <div className="form-group"><input type="text" className="form-input" placeholder="Name" value={newItem.name} onChange={e=>setNewItem({...newItem, name: e.target.value})} /></div>
                            <div className="form-group"><input type="text" className="form-input" placeholder="Category (e.g. Snacks)" value={newItem.category} onChange={e=>setNewItem({...newItem, category: e.target.value})} /></div>
                            <div className="form-group"><input type="number" className="form-input" placeholder="Price (₹)" value={newItem.price} onChange={e=>setNewItem({...newItem, price: e.target.value})} /></div>
                            <div className="form-group"><textarea className="form-input" placeholder="Description" value={newItem.description} onChange={e=>setNewItem({...newItem, description: e.target.value})} /></div>
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" checked={newItem.is_veg} onChange={e=>setNewItem({...newItem, is_veg: e.target.checked})} /> Veg</label>
                            </div>
                            <button className="btn btn-primary" onClick={handleSaveNewItem} disabled={!newItem.name || !newItem.price} style={{ width: '100%' }}>Save Item</button>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {menu.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>₹{item.price} • {item.category}</div>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: item.is_available ? '#2E7D32' : '#999' }}>{item.is_available ? 'Available' : 'Sold Out'}</span>
                                    <input type="checkbox" checked={item.is_available} onChange={() => handleToggleMenu(item.id)} style={{ transform: 'scale(1.2)' }} />
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div style={{ background: 'white', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                        <div>
                            <h2 style={{ fontSize: '1.4rem' }}>{selectedOutlet?.name}</h2>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{selectedOutlet?.cuisine} • Rating: ⭐ {selectedOutlet?.rating}</div>
                        </div>
                        <button 
                            onClick={handleToggleOutlet}
                            style={{ padding: '8px 24px', borderRadius: 'var(--radius-lg)', border: 'none', fontWeight: 800, fontSize: '1rem', background: selectedOutlet?.is_open ? '#E8F5E9' : '#ffebee', color: selectedOutlet?.is_open ? '#2E7D32' : '#d84315', cursor: 'pointer' }}
                        >
                            {selectedOutlet?.is_open ? 'OPEN' : 'CLOSED'}
                        </button>
                    </div>

                    <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Edit Outlet Info</h3>
                    <div className="form-group">
                        <label className="form-label">UPI ID (Crucial for Payments)</label>
                        <input type="text" className="form-input" placeholder="merchant@upi" defaultValue="merchant@upi" />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Opening Time</label>
                            <input type="time" className="form-input" defaultValue="09:00" />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Closing Time</label>
                            <input type="time" className="form-input" defaultValue="18:00" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Max Orders Per Slot</label>
                        <input type="number" className="form-input" defaultValue="10" min="1" max="50" />
                    </div>
                    <button className="btn btn-primary btn-block" onClick={() => showToast('Settings saved successfully (Mocked)')}>Save Settings</button>
                </div>
            )}
        </div>
    );
}
