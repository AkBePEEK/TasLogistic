import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
/**
 * Обёртка маршрута. Если пользователь не авторизован — на /login.
 * Если авторизован, но роль не совпадает — на fallback (/dashboard).
 * Пока идёт проверка сессии (isLoading) — показываем спиннер.
 */
export function RequireRole({ roles, children, fallback = '/dashboard' }) {
    const { user, isLoading } = useAuth();
    const location = useLocation();
    if (isLoading) {
        return (_jsx("div", { className: "flex h-screen items-center justify-center", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" }) }));
    }
    if (!user) {
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    if (!roles.includes(user.role)) {
        return _jsx(Navigate, { to: fallback, replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
