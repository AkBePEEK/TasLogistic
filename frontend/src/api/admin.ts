import { apiClient } from './client';
import {ApiResponse, Status} from '@/types';

export interface AdminItem {
    id: string;
    trackingCode: string;
    title: string;
    currentStatus: Status;
    createdAt: string;
    updatedAt: string;
    fromCity?: string;
    toCity?: string;
    recipientName?: string;
    cashOnDelivery?: number;
    seller: { email: string };
}

export interface AdminPaginatedItems {
    items: AdminItem[];
    total: number;
    page: number;
    limit: number;
}

export interface AdminReports {
    period: string;
    dateFrom: string;
    total: number;
    totalAmount: number;
    totalWeight: number;
    deliveredAmount: number;
    deliveredWeight: number;
    statusCounts: Partial<Record<string, number>>;
    topCities: { city: string; count: number }[];
}

export const adminApi = {
    getItems: (params: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        fromCity?: string;
        toCity?: string;
        dateFrom?: string;
        dateTo?: string;
    } = {}) =>
        apiClient.get<ApiResponse<AdminPaginatedItems>>('/admin/items', { params }),

    updateStatus: (id: string, status: string) =>
        apiClient.patch<ApiResponse<AdminItem>>(`/admin/items/${id}/status`, { status }),

    deleteItem: (id: string) =>
        apiClient.delete<ApiResponse>(`/admin/items/${id}`),

    getReports: (period: string) =>
        apiClient.get<ApiResponse<AdminReports>>('/admin/reports', {
            params: { period },
        }),
};