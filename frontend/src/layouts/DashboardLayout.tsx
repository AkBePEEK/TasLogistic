import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/types';
import { LogoLink } from '@/components/LogoLink';

interface NavItem {
    label: string;
    to: string;
    roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Мои товары',   to: '/dashboard/seller/items',    roles: ['SELLER'] },
    { label: 'Добавить',     to: '/dashboard/seller/create',   roles: ['SELLER'] },
    { label: 'Все товары',   to: '/dashboard/admin/items',     roles: ['ADMIN'] },
    { label: 'Отчёты',       to: '/dashboard/admin/reports',   roles: ['ADMIN'] },
    { label: 'Мои заказы',   to: '/dashboard/customer/orders', roles: ['CUSTOMER'] },
    { label: 'История заказов', to: '/dashboard/customer/history',roles: ['CUSTOMER'] },
    { label: 'Профиль',      to: '/dashboard/profile',         roles: ['SELLER', 'ADMIN', 'CUSTOMER'] },
];

export function DashboardLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const visibleNav = NAV_ITEMS.filter(
        (item) => user && item.roles.includes(user.role)
    );

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            {/* Логотип */}
            <div className="flex h-18 items-center border-b border-gray-200 px-6">
                <LogoLink clickable={true} size="md" />
            </div>

            {/* Навигация */}
            <nav className="flex-1 overflow-y-auto px-4 py-4">
                <ul className="space-y-1">
                    {visibleNav.map((item) => (
                        <li key={item.to}>
                            <NavLink
                                to={item.to}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    [
                                        'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-600 hover:bg-gray-100',
                                    ].join(' ')
                                }
                            >
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Пользователь */}
            <div className="border-t border-gray-200 p-4 space-y-2">
                <p className="truncate text-xs text-gray-400">{user?.email}</p>
                <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
          {user?.role}
        </span>
                <button
                    onClick={handleLogout}
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                    Выйти
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">

            {/* ── Мобильный overlay ──────────────────────────────── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Сайдбар мобильный (выезжает) ───────────────────── */}
            <aside
                className={[
                    'fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:hidden',
                    sidebarOpen ? 'flex translate-x-0' : 'flex -translate-x-full',
                ].join(' ')}
            >
                <SidebarContent />
            </aside>

            {/* ── Сайдбар десктопный (всегда виден) ──────────────── */}
            <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
                <SidebarContent />
            </aside>

            {/* ── Основной контент ────────────────────────────────── */}
            <div className="flex flex-1 flex-col overflow-hidden">

                {/* Мобильный хедер с кнопкой меню */}
                <header className="flex h-14 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                        aria-label="Открыть меню"
                    >
                        {/* Иконка бургер */}
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <LogoLink clickable={true} size="sm" />
                </header>

                {/* Контент страницы */}
                <main className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}