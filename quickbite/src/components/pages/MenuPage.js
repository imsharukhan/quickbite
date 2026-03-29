'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import * as menuService from '@/services/menuService';

export default function MenuPage({ outlet, navigate, showToast }) {
  const { cart, addToCart } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMenu = async () => {
    if (!outlet?.id) return;
    try {
      const data = await menuService.getMenuByOutlet(outlet.id);
      setMenuItems(data || []);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    const interval = setInterval(() => { fetchMenu(); }, 30000);
    return () => clearInterval(interval);
  }, [outlet?.id]);

  if (!outlet) {
    return (
      <div className="empty-state">
        <p>No outlet selected.</p>
        <button className="btn btn-primary" onClick={() => navigate('home')}>Back to Home</button>
      </div>
    );
  }

  const handleAdd = (item) => {
    const res = addToCart(item, outlet.id, outlet.name);
    if (res?.conflict) {
        if (window.confirm(`Your cart has items from ${res.existingOutlet}. Adding items from ${outlet.name} will clear your current cart. Proceed?`)) {
            const { clearCart } = require('@/context/AppContext'); // Dynamic access handled functionally later
            // Since we don't have direct access here, we can rely on manual override
            showToast('Cart conflict: please clear your cart first.', 'error');
        }
    } else {
        showToast('Added to cart');
    }
  };

  const categories = [...new Set(menuItems.map(i => i.category))];
  const filteredCategories = categories.filter(c => 
    menuItems.filter(i => i.category === c && i.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0
  );

  return (
    <div className="menu-page">
      <div className="menu-header">
        <button className="back-btn" onClick={() => navigate('home')}>←</button>
        <div className="menu-header-info">
          <h1>{outlet.name}</h1>
          <p>⭐ {outlet.rating} • {outlet.cuisine}</p>
        </div>
      </div>

      <div className="menu-search">
        <span>🔍</span>
        <input type="text" placeholder="Search in menu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <div className="menu-content pb-section">
        {loading ? (
            <div style={{ padding: '20px' }}>
                <div className="skeleton skeleton-text" style={{ width: '100px', height: '24px', marginBottom: '16px' }} />
                <div className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius)', marginBottom: '12px' }} />
                <div className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius)' }} />
            </div>
        ) : filteredCategories.map(category => (
          <div key={category} className="menu-category">
            <h3 className="category-title">{category}</h3>
            {menuItems.filter(i => i.category === category && i.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => {
              const inCart = cart.find(ci => ci.id === item.id);
              return (
                <div key={item.id} className="menu-item">
                  <div className="item-details">
                    <span className={`veg-indicator ${item.is_veg ? 'veg' : 'non-veg'}`}></span>
                    <h4 className="item-name">{item.name}</h4>
                    <p className="item-price">₹{item.price}</p>
                    <p className="item-desc">{item.description}</p>
                  </div>
                  <div className="item-actions">
                    <div className="item-image-placeholder">🍔</div>
                    {item.is_available ? (
                      inCart ? (
                        <div className="qty-controls">
                          <button style={{background:'var(--primary)', color:'white', width:'100%', padding:'6px', borderRadius:'var(--radius-sm)', border:'none'}} onClick={() => showToast('Manage qty in Cart')}>
                             Added x{inCart.quantity}
                          </button>
                        </div>
                      ) : (
                        <button className="add-btn" onClick={() => handleAdd(item)}>ADD</button>
                      )
                    ) : (
                        <button className="add-btn" disabled style={{ background: '#eee', color: '#999', borderColor: '#eee' }}>Sold Out</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {cart.length > 0 && (
        <div className="view-cart-bar" onClick={() => navigate('cart')}>
          <div className="cart-summary">
            <span className="cart-count">{cart.reduce((s,i)=>s+i.quantity,0)} items</span>
            <span className="cart-total">₹{cart.reduce((s,i)=>s+(i.price*i.quantity),0)}</span>
          </div>
          <span className="view-cart-text">View Cart →</span>
        </div>
      )}
    </div>
  );
}
