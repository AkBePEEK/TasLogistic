import { apiClient } from './client';
import { ApiResponse, Status } from '@/types';

export interface TrackedItemSummary {
    trackedItemId: string;
    addedAt: string;
    id: string;
    trackingCode: string;
    title: string;
    currentStatus: Status;
    updatedAt: string;
    createdAt: string;
    fromCity?: string;
    toCity?: string;
    recipientName?: string;
    weight?: number;
    statusHistory: { newStatus: Status; changedAt: string }[];
}

export interface TrackedItemDetail {
    addedAt: string;
    id: string;
    trackingCode: string;
    title: string;
    description?: string;
    currentStatus: Status;
    createdAt: string;
    updatedAt: string;
    recipientName?: string;
    recipientPhone?: string;
    fromCity?: string;
    toCity?: string;
    weight?: number;
    cashOnDelivery?: number;
    comment?: string;
    statusHistory: {
        id: string;
        oldStatus: Status;
        newStatus: Status;
        changedAt: string;
        location?: string;
    }[];
}

export interface CustomerStats {
    total: number;
    statusCounts: Partial<Record<Status, number>>;
    totalPaid: number;
    totalToPay: number;
}

export const customerApi = {
    getStats: () =>
        apiClient.get<ApiResponse<CustomerStats>>('/customer/stats'),

    /** Все отслеживаемые товары */
    getTracked: () =>
        apiClient.get<ApiResponse<{ items: TrackedItemSummary[]; total: number }>>(
            '/customer/tracked'
        ),

    /** Добавить по трек-коду */
    addTracked: (trackingCode: string) =>
        apiClient.post<ApiResponse<{ trackedItemId: string }>>('/customer/tracked', {
            trackingCode,
        }),

    /** Убрать из отслеживания */
    removeTracked: (itemId: string) =>
        apiClient.delete<ApiResponse>(`/customer/tracked/${itemId}`),

    /** Полная история одного заказа */
    getHistory: (itemId: string) =>
        apiClient.get<ApiResponse<TrackedItemDetail>>(
            `/customer/tracked/${itemId}/history`
        ),
};