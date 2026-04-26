import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * После логина перенаправляем на нужный раздел по роли.
 * Единая точка входа — unified dashboard, разные разделы.
 */
export function DashboardIndex() {
    const { user } = useAuth();

    if (user?.role === 'SELLER')   return <Navigate to="/dashboard/seller/items" replace />;
    if (user?.role === 'ADMIN')    return <Navigate to="/dashboard/admin/items" replace />;
    if (user?.role === 'CUSTOMER') return <Navigate to="/dashboard/customer/orders" replace />;

    return <Navigate to="/login" replace />;
}