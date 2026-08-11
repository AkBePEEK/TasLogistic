import { apiClient } from './client';
import {ApiResponse, Status} from '@/types';
import {CarrierType} from './carrier';

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
    recipientPhone?: string;
    cashOnDelivery?: number;
    weight?: number;
    deliveryType?: CarrierType;
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
    weightByDeliveryType: Partial<Record<'AVIA' | 'RAIL' | 'TRUCK', number>>;
    weightByCityAndDeliveryType: Record<string, Record<string, number>>;
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
        deliveryType?: string;
    } = {}) =>
        apiClient.get<ApiResponse<AdminPaginatedItems>>('/admin/items', { params }),

    getDailyList: (params: { date?: string; deliveryType?: string } = {}) =>
        apiClient.get<ApiResponse<{ items: AdminItem[]; date: string }>>('/admin/items/daily', { params }),

    updateStatus: (id: string, status: string) =>
        apiClient.patch<ApiResponse<AdminItem>>(`/admin/items/${id}/status`, { status }),

    deleteItem: (id: string) =>
        apiClient.delete<ApiResponse>(`/admin/items/${id}`),

    getReports: (period: string) =>
        apiClient.get<ApiResponse<AdminReports>>('/admin/reports', {
            params: { period },
        }),

    bulkUpdateStatus: (ids: string[], status: string) =>
        apiClient.patch<ApiResponse>('/admin/items/bulk-status', { ids, status }),
};