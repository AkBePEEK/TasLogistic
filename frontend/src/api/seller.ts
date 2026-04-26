import { apiClient } from './client';
import {ApiResponse, Item, PaginatedItems, StatusHistoryEntry} from '@/types';

export interface ItemDetail extends Item {
    statusHistory: StatusHistoryEntry[];
}

export const sellerApi = {
    getItems: (page = 1, limit = 20) =>
        apiClient.get<ApiResponse<PaginatedItems>>('/seller/items', {
            params: { page, limit },
        }),

    getItemById: (id: string) =>
        apiClient.get<ApiResponse<ItemDetail>>(`/seller/items/${id}`),  // ← добавить

    createItem: (data: { title: string; description?: string }) =>
        apiClient.post<ApiResponse<Item>>('/seller/items', data),

    updateStatus: (id: string, status: string) =>
        apiClient.patch<ApiResponse<Item>>(`/seller/items/${id}/status`, { status }),
};