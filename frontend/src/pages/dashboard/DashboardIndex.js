import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
/**
 * После логина перенаправляем на нужный раздел по роли.
 * Единая точка входа — unified dashboard, разные разделы.
 */
export function DashboardIndex() {
    const { user } = useAuth();
    if (user?.role === 'SELLER')
        return _jsx(Navigate, { to: "/dashboard/seller/items", replace: true });
    if (user?.role === 'ADMIN')
        return _jsx(Navigate, { to: "/dashboard/admin/items", replace: true });
    if (user?.role === 'CUSTOMER')
        return _jsx(Navigate, { to: "/dashboard/customer/orders", replace: true });
    return _jsx(Navigate, { to: "/login", replace: true });
}
