'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as orderService from '../services/orderService';
import * as notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export function AppProvider({ children }) {
    const { isLoggedIn } = useAuth();
    
    // Legacy cart
    const [cart, setCart] = useState([]);
    
    // New states
    const [orders, setOrders] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [upiDeepLink, setUpiDeepLink] = useState('');
    const [lastPlacedOrder, setLastPlacedOrder] = useState(null);
    const [isOrdersLoading, setIsOrdersLoading] = useState(false);
    const [isNotifsLoading, setIsNotifsLoading] = useState(false);
    const isSubmittingRef = useRef(false);

    useEffect(() => {
        try {
            const savedCart = localStorage.getItem('qb_cart');
            if (savedCart) setCart(JSON.parse(savedCart));
        } catch (e) {}
    }, []);

    useEffect(() => { localStorage.setItem('qb_cart', JSON.stringify(cart)); }, [cart]);

    const loadOrders = async () => {
        setIsOrdersLoading(true);
        try {
            const data = await orderService.getMyOrders();
            setOrders(data || []);
        } catch(e) {
            console.error(e);
        } finally {
            setIsOrdersLoading(false);
        }
    };

    const loadNotifications = async () => {
        setIsNotifsLoading(true);
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data.notifications || []);
        } catch(e) {
            console.error(e);
        } finally {
            setIsNotifsLoading(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            loadOrders();
            loadNotifications();
        } else {
            setOrders([]);
            setNotifications([]);
            setCart([]);
            setUpiDeepLink('');
            setLastPlacedOrder(null);
        }
    }, [isLoggedIn]);

    const addToCart = useCallback((item, outletId, outletName) => {
        let conflict = false;
        let existingOutlet = '';
        
        setCart(prev => {
            if (prev.length > 0 && prev[0].outletId !== outletId) {
                conflict = true;
                existingOutlet = prev[0].outletName;
                return prev;
            }
            const existing = prev.find(ci => ci.id === item.id);
            if (existing) {
                return prev.map(ci => ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
            }
            return [...prev, { ...item, quantity: 1, outletId, outletName }];
        });
        
        if (conflict) {
            return { conflict: true, existingOutlet };
        }
        return { conflict: false };
    }, []);

    const removeFromCart = useCallback((itemId) => setCart(prev => prev.filter(ci => ci.id !== itemId)), []);
    const updateCartQuantity = useCallback((itemId, quantity) => {
        if (quantity <= 0) setCart(prev => prev.filter(ci => ci.id !== itemId));
        else setCart(prev => prev.map(ci => ci.id === itemId ? { ...ci, quantity } : ci));
    }, []);
    const clearCart = useCallback(() => setCart([]), []);

    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const placeOrder = async (pickup_time) => {
        if (isSubmittingRef.current) return;
        if (cart.length === 0) return;
        
        isSubmittingRef.current = true;
        try {
            const outlet_id = cart[0].outletId;
            const items = cart.map(i => ({ menu_item_id: i.id, quantity: i.quantity }));
            
            const response = await orderService.placeOrder(outlet_id, items, pickup_time);
            setUpiDeepLink(response.upi_deep_link || '');
            setLastPlacedOrder(response);
            clearCart();
            await loadOrders();
            return response;
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const markNotificationRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            await loadNotifications();
        } catch(e){}
    };

    const markAllNotificationsRead = async () => {
        try {
            await notificationService.markAllRead();
            await loadNotifications();
        } catch(e){}
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <AppContext.Provider value={{
            cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal, cartCount,
            orders, setOrders, placeOrder, loadOrders, isOrdersLoading,
            upiDeepLink, setUpiDeepLink, lastPlacedOrder, setLastPlacedOrder,
            notifications, markNotificationRead, markAllNotificationsRead, unreadCount, isNotifsLoading,
            isSubmittingRef
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
}
