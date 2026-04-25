import axios from 'axios';

/**
 * Единый axios-инстанс.
 * `withCredentials: true` — обязательно для отправки httpOnly cookies.
 */
export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

// Глобальный interceptor для редиректа при 401
apiClient.interceptors.response.use(
    (r) => r,
    (error) => {
        if (error.response?.status === 401) {
            // Очищаем auth state через событие — AuthContext подпишется
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        return Promise.reject(error);
    }
);