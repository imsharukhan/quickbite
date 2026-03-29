'use client';
import api from './api';
export const getMenuByOutlet = (outlet_id) => api.get(`/api/menu/${outlet_id}`).then(res => res.data);
