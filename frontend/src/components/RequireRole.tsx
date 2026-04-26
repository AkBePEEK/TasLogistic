import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/types';

interface Props {
    roles: Role[];
    children: ReactNode;
    /** Куда редиректить при несоответствии роли. По умолчанию /dashboard */
    fallback?: string;
}

/**
 * Обёртка маршрута. Если пользователь не авторизован — на /login.
 * Если авторизован, но роль не совпадает — на fallback (/dashboard).
 * Пока идёт проверка сессии (isLoading) — показываем спиннер.
 */
export function RequireRole({ roles, children, fallback = '/dashboard' }: Props) {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!roles.includes(user.role)) {
        return <Navigate to={fallback} replace />;
    }

    return <>{children}</>;
}