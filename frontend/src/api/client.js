import axios from 'axios';
/**
 * Единый axios-инстанс.
 * `withCredentials: true` — обязательно для отправки httpOnly cookies.
 */
export const apiClient = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});
let isRefreshing = false;
let failedQueue = [];
const processQueue = (error) => {
    failedQueue.forEach((p) => {
        if (error)
            p.reject(error);
        else
            p.resolve(undefined);
    });
    failedQueue = [];
};
// Глобальный interceptor для редиректа при 401
apiClient.interceptors.response.use((r) => r, async (error) => {
    const originalRequest = error.config;
    // Если 401 и это не запрос на refresh/login/register
    if (error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/refresh') &&
        !originalRequest.url?.includes('/auth/login') &&
        !originalRequest.url?.includes('/auth/register')) {
        if (isRefreshing) {
            // Ставим запрос в очередь пока идёт refresh
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(() => apiClient(originalRequest));
        }
        originalRequest._retry = true;
        isRefreshing = true;
        try {
            // Пробуем обновить токен
            await apiClient.post('/auth/refresh');
            processQueue(null);
            return apiClient(originalRequest); // повторяем оригинальный запрос
        }
        catch (refreshError) {
            processQueue(refreshError);
            // Refresh не удался — разлогиниваем
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            return Promise.reject(refreshError);
        }
        finally {
            isRefreshing = false;
        }
    }
    return Promise.reject(error);
});
