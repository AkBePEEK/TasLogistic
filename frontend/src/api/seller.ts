import { apiClient } from './client';
import {ApiResponse, Item, Status} from '@/types';

export interface ItemDetail extends Item {
    statusHistory: StatusHistoryEntry[];
}

export interface StatusHistoryEntry {
    id: string;
    oldStatus: Status;
    newStatus: Status;
    changedAt: string;
    location?: string;
}

export interface ItemDetail extends Item {
    recipientName?: string;
    recipientPhone?: string;
    senderName?: string;
    senderPhone?: string;
    fromCity?: string;
    toCity?: string;
    weight?: number;
    itemsCount?: number;
    cashOnDelivery?: number;
    comment?: string;
    statusHistory: StatusHistoryEntry[];
}

export interface PaginatedItems {
    items: Item[];
    total: number;
    page: number;
    limit: number;
    monthlyCount: number;
}

export const sellerApi = {
    getItems: (page = 1, limit = 20) =>
        apiClient.get<ApiResponse<PaginatedItems>>('/seller/items', {
            params: { page, limit },
        }),

    getItemById: (id: string) =>
        apiClient.get<ApiResponse<ItemDetail>>(`/seller/items/${id}`),

    createItem: (data: object) =>
        apiClient.post<ApiResponse<Item>>('/seller/items', data),

    updateStatus: (id: string, status: string, location?: string) =>
        apiClient.patch<ApiResponse<Item>>(`/seller/items/${id}/status`, {
            status,
            location,
        }),
};