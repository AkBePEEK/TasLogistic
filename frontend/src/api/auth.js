import { apiClient } from './client';
export const authApi = {
    register: (data) => apiClient.post('/auth/register', data),
    login: (data) => apiClient.post('/auth/login', data),
    logout: () => apiClient.post('/auth/logout'),
    // Используется при инициализации — проверяем наличие валидного cookie
    me: () => apiClient.get('/auth/me'),
};
