'use client';
import api from './api';
export const getNotifications = () => api.get('/api/notifications').then(res => res.data);
export const markAsRead = (id) => api.patch(`/api/notifications/${id}/read`).then(res => res.data);
export const markAllRead = () => api.patch('/api/notifications/read-all').then(res => res.data);
