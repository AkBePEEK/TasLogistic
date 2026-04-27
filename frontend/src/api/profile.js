import { apiClient } from './client';
export const profileApi = {
    get: () => apiClient.get('/profile'),
    updateEmail: (data) => apiClient.patch('/profile/email', data),
    updatePassword: (data) => apiClient.patch('/profile/password', data),
};
