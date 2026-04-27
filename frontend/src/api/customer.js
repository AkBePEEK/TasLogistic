import { apiClient } from './client';
export const customerApi = {
    /** Все отслеживаемые товары */
    getTracked: () => apiClient.get('/customer/tracked'),
    /** Добавить по трек-коду */
    addTracked: (trackingCode) => apiClient.post('/customer/tracked', {
        trackingCode,
    }),
    /** Убрать из отслеживания */
    removeTracked: (itemId) => apiClient.delete(`/customer/tracked/${itemId}`),
    /** Полная история одного заказа */
    getHistory: (itemId) => apiClient.get(`/customer/tracked/${itemId}/history`),
};
