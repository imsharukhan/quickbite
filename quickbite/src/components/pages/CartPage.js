'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import * as outletService from '@/services/outletService';
import * as menuService from '@/services/menuService';

export default function CartPage({ navigate, showToast }) {
  const { cart, removeFromCart, updateCartQuantity, cartTotal, placeOrder, upiDeepLink, lastPlacedOrder, isSubmittingRef } = useApp();
  const { user } = useAuth();
  
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  
  const [outletClosed, setOutletClosed] = useState(false);
  const [closedMessage, setClosedMessage] = useState('');
  
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (cart.length === 0) return;
    const outlet_id = cart[0].outletId;
    
    // Check if outlet is open and items are available
    setLoading(true);
    Promise.all([
      outletService.getOutletById(outlet_id),
      menuService.getMenuByOutlet(outlet_id),
      outletService.getAvailableSlots(outlet_id)
    ]).then(([outletData, menuData, slotsData]) => {
      if (!outletData.is_open) {
        setOutletClosed(true);
        setClosedMessage(`⚠️ ${cart[0].outletName} is currently closed. You cannot place an order.`);
      } else {
        // Item availability check
        let unavailableItem = null;
        for (let item of cart) {
          const apiItem = menuData.find(m => m.id === item.id);
          if (!apiItem || !apiItem.is_available) {
            unavailableItem = item.name;
            break;
          }
        }
        if (unavailableItem) {
           setOutletClosed(true);
           setClosedMessage(`⚠️ ${unavailableItem} is no longer available. Please remove it from cart.`);
        }
      }
      setSlots(slotsData || []);
    }).catch(e => {
        setOutletClosed(true);
        setClosedMessage('⚠️ Failed to verify outlet status.');
    }).finally(() => {
        setLoading(false);
    });
  }, [cart]);

  if (showOrderConfirmation && lastPlacedOrder) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
    return (
      <div className="cart-page pb-section" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-lg)', padding: '28px', textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: '4px' }}>YOUR TOKEN NUMBER</div>
            <div style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 1, marginBottom: '8px' }}>
               #{lastPlacedOrder?.token_number || lastPlacedOrder?.id?.toString().slice(-3) || '---'}
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>Show this number at the counter</div>
        </div>
        
        <div style={{ width: '100%', background: 'var(--bg)', padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
            <p style={{ margin: '8px 0', fontSize: '0.9rem' }}><strong>Order ID:</strong> {lastPlacedOrder.id}</p>
            <p style={{ margin: '8px 0', fontSize: '0.9rem' }}><strong>Student:</strong> {user?.name} | Reg: {user?.register_number || user?.id?.substring(0,8)}</p>
            <p style={{ margin: '8px 0', fontSize: '0.9rem' }}><strong>Outlet:</strong> {lastPlacedOrder.outletName || 'Campus Outlet'}</p>
            <p style={{ margin: '8px 0', fontSize: '0.9rem' }}><strong>Pickup:</strong> {lastPlacedOrder.pickupTime || lastPlacedOrder.pickup_time}</p>
            <p style={{ margin: '8px 0', fontSize: '1.1rem', fontWeight: 700 }}>Total: ₹{lastPlacedOrder.total}</p>
        </div>

        <div style={{ width: '100%', marginBottom: '20px' }}>
           {upiDeepLink ? (
               isMobile ? (
                  <button className="btn btn-primary btn-block" onClick={() => window.location.href = upiDeepLink} style={{ backgroundColor: '#2ECC99', fontSize: '1.1rem', padding: '16px' }}>
                     Pay ₹{lastPlacedOrder.total} via UPI
                  </button>
               ) : (
                  <div className="upi-copy-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
                     <span style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 600 }}>UPI ID: {upiDeepLink.split('pa=')[1]?.split('&')[0] || 'quickbite@upi'}</span>
                     <button onClick={() => { navigator.clipboard.writeText(upiDeepLink.split('pa=')[1]?.split('&')[0] || 'quickbite@upi'); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem'}}>{copied ? '✅' : '📋'}</button>
                  </div>
               )
           ) : (
               <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontWeight: 'bold' }}>Payment Verified</div>
           )}
        </div>

        <button className="btn btn-outline btn-block" onClick={() => { setShowOrderConfirmation(false); navigate('orders'); }}>View My Orders</button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Looks like you haven't added anything yet.</p>
        <button className="btn btn-primary" onClick={() => navigate('home')} style={{ marginTop: '16px' }}>Browse Food</button>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!selectedSlot) { showToast('Please select a pickup time', 'error'); return; }
    if (isSubmittingRef.current) return;
    setLoading(true);
    try {
      await placeOrder(selectedSlot);
      setShowOrderConfirmation(true);
    } catch(err) {
      showToast('Failed to place order', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-page pb-section">
      <div className="menu-header" style={{ marginBottom: '20px' }}>
        <button className="back-btn" onClick={() => navigate('menu', { id: cart[0].outletId, name: cart[0].outletName })}>←</button>
        <div className="menu-header-info">
          <h1>Your Cart</h1>
          <p>{cart[0].outletName}</p>
        </div>
      </div>

      {outletClosed && (
        <div style={{ background: '#FFF3E0', color: '#E65100', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontWeight: 600, fontSize: '0.85rem' }}>
           {closedMessage}
        </div>
      )}

      <div className="cart-items">
        {cart.map(item => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-info">
              <span className={`veg-indicator ${item.is_veg ? 'veg' : 'non-veg'}`}></span>
              <div>
                <h4 className="cart-item-name">{item.name}</h4>
                <p className="cart-item-price">₹{item.price}</p>
              </div>
            </div>
            <div className="cart-item-controls">
              <button className="qty-btn" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>-</button>
              <span className="qty-value">{item.quantity}</span>
              <button className="qty-btn" onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-section">
        <h3>Pickup Time</h3>
        {loading ? (
             <div style={{ display: 'flex', gap: '8px' }}>
               <div className="skeleton" style={{ height: '40px', width: '80px', borderRadius: 'var(--radius)' }} />
               <div className="skeleton" style={{ height: '40px', width: '80px', borderRadius: 'var(--radius)' }} />
             </div>
        ) : slots.length === 0 ? (
             <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No slots available today.</p>
        ) : (
             <div className="time-slots">
                {slots.map(slot => (
                    <button 
                        key={slot.time} 
                        className={`time-slot ${selectedSlot === slot.time ? 'selected' : ''}`}
                        disabled={slot.is_full}
                        style={slot.is_full ? { opacity: 0.5, cursor: 'not-allowed', background: '#eee', borderColor: '#ddd', color: '#999' } : {}}
                        onClick={() => setSelectedSlot(slot.time)}
                    >
                        {slot.time}
                        <span className="slot-btn-count" style={{ display: 'block', fontSize: '0.65rem', marginTop: '2px' }}>
                           {slot.is_full ? 'Full' : `${slot.available_slots} left`}
                        </span>
                    </button>
                ))}
             </div>
        )}
      </div>

      <div className="cart-section">
        <h3>Payment Method</h3>
        <div style={{ padding: '14px', border: '1px solid var(--primary)', borderRadius: 'var(--radius)', background: 'var(--bg)', fontWeight: '600', color: 'var(--text)' }}>
             Unified Payments Interface (UPI)
        </div>
      </div>

      <div className="cart-summary-box">
        <div className="summary-row">
          <span>Item Total</span>
          <span>₹{cartTotal}</span>
        </div>
        <div className="summary-row">
          <span>Platform Fee</span>
          <span>₹2.00</span>
        </div>
        <div className="summary-row total">
          <span>Amount to Pay</span>
          <span>₹{cartTotal + 2}</span>
        </div>
      </div>

      <div className="fixed-bottom-bar">
        <button 
          className="btn btn-primary btn-block place-order-btn"
          disabled={!selectedSlot || loading || outletClosed}
          onClick={handlePlaceOrder}
        >
          {loading ? <div className="spinner"></div> : `Place Order • ₹${cartTotal + 2}`}
        </button>
      </div>
    </div>
  );
}
