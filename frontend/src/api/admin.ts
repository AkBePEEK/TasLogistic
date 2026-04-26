import { apiClient } from './client';
import { ApiResponse, PaginatedItems, Item } from '@/types';

export const adminApi = {
    getItems: (page = 1, limit = 20, search?: string) =>
        apiClient.get<ApiResponse<PaginatedItems>>('/admin/items', {
            params: { page, limit, search },
        }),

    updateStatus: (id: string, status: string) =>
        apiClient.patch<ApiResponse<Item>>(`/admin/items/${id}/status`, { status }),
};