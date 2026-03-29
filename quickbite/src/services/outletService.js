'use client';
import api from './api';
export const getAllOutlets = () => api.get('/api/outlets').then(res => res.data);
export const getOutletById = (id) => api.get(`/api/outlets/${id}`).then(res => res.data);
export const getAvailableSlots = (outlet_id, date) => {
    let url = `/api/outlets/${outlet_id}/slots`;
    if (date) url += `?date=${date}`;
    return api.get(url).then(res => res.data);
};
