import { apiClient } from './client';
export const sellerApi = {
    getItems: (page = 1, limit = 20) => apiClient.get('/seller/items', {
        params: { page, limit },
    }),
    getItemById: (id) => apiClient.get(`/seller/items/${id}`), // ← добавить
    createItem: (data) => apiClient.post('/seller/items', data),
    updateStatus: (id, status) => apiClient.patch(`/seller/items/${id}/status`, { status }),
};
