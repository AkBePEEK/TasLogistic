import { apiClient } from './client';
export const adminApi = {
    getItems: (page = 1, limit = 20, search) => apiClient.get('/admin/items', {
        params: { page, limit, search },
    }),
    updateStatus: (id, status) => apiClient.patch(`/admin/items/${id}/status`, { status }),
};
