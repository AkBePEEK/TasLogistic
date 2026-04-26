import { apiClient } from './client';
import { AuthUser, ApiResponse } from '@/types';

export const authApi = {
    register: (data: { email: string; password: string; role: string }) =>
        apiClient.post<ApiResponse<AuthUser>>('/auth/register', data),

    login: (data: { email: string; password: string }) =>
        apiClient.post<ApiResponse<AuthUser>>('/auth/login', data),

    logout: () => apiClient.post<ApiResponse>('/auth/logout'),

    // Используется при инициализации — проверяем наличие валидного cookie
    me: () => apiClient.get<ApiResponse<AuthUser>>('/auth/me'),
};