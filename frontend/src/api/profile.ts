import { apiClient } from './client';
import { ApiResponse, Role } from '@/types';

export interface ProfileData {
    id: string;
    email: string;
    role: Role;
    createdAt: string;
}

export const profileApi = {
    get: () =>
        apiClient.get<ApiResponse<ProfileData>>('/profile'),

    updateEmail: (data: { email: string; currentPassword: string }) =>
        apiClient.patch<ApiResponse<ProfileData>>('/profile/email', data),

    updatePassword: (data: { currentPassword: string; newPassword: string }) =>
        apiClient.patch<ApiResponse>('/profile/password', data),
};