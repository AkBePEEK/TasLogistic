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
    statusHistory: {
        id: string;
        oldStatus: Status;
        newStatus: Status;
        changedAt: string;
    }[];
}

export const customerApi = {
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