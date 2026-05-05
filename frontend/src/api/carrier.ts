import { apiClient } from './client';
import { ApiResponse } from '@/types';

export type CarrierType = 'AVIA' | 'RAIL' | 'TRUCK';

export interface Carrier {
    id: string;
    name: string;
    city: string;
    phone: string;
    type: CarrierType;
    createdAt: string;
}

export const CARRIER_TYPE_LABELS: Record<CarrierType, string> = {
    AVIA:  '✈️ Авиа',
    RAIL:  '🚂 ЖД',
    TRUCK: '🚛 Фура',
};

export const carriersApi = {
    getByCity: (city?: string) =>
        apiClient.get<ApiResponse<Carrier[]>>('/carriers', {
            params: city ? { city } : {},
        }),

    create: (data: Omit<Carrier, 'id' | 'createdAt'>) =>
        apiClient.post<ApiResponse<Carrier>>('/carriers', data),

    update: (id: string, data: Partial<Omit<Carrier, 'id' | 'createdAt'>>) =>
        apiClient.patch<ApiResponse<Carrier>>(`/carriers/${id}`, data),

    delete: (id: string) =>
        apiClient.delete<ApiResponse>(`/carriers/${id}`),
};