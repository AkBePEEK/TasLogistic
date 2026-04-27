import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogoLink } from '@/components/LogoLink';
const NAV_ITEMS = [
    { label: 'Мои товары', to: '/dashboard/seller/items', roles: ['SELLER'] },
    { label: 'Добавить', to: '/dashboard/seller/create', roles: ['SELLER'] },
    { label: 'Все товары', to: '/dashboard/admin/items', roles: ['ADMIN'] },
    { label: 'Мои заказы', to: '/dashboard/customer/orders', roles: ['CUSTOMER'] },
    { label: 'Профиль', to: '/dashboard/profile', roles: ['SELLER', 'ADMIN', 'CUSTOMER'] },
];
export function DashboardLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };
    const visibleNav = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));
    const SidebarContent = () => (_jsxs("div", { className: "flex h-full flex-col", children: [_jsx("div", { className: "flex h-18 items-center border-b border-gray-200 px-6", children: _jsx(LogoLink, { clickable: true, size: "md" }) }), _jsx("nav", { className: "flex-1 overflow-y-auto px-4 py-4", children: _jsx("ul", { className: "space-y-1", children: visibleNav.map((item) => (_jsx("li", { children: _jsx(NavLink, { to: item.to, onClick: () => setSidebarOpen(false), className: ({ isActive }) => [
                                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-gray-600 hover:bg-gray-100',
                            ].join(' '), children: item.label }) }, item.to))) }) }), _jsxs("div", { className: "border-t border-gray-200 p-4 space-y-2", children: [_jsx("p", { className: "truncate text-xs text-gray-400", children: user?.email }), _jsx("span", { className: "inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700", children: user?.role }), _jsx("button", { onClick: handleLogout, className: "mt-2 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors", children: "\u0412\u044B\u0439\u0442\u0438" })] })] }));
    return (_jsxs("div", { className: "flex h-screen overflow-hidden bg-gray-50", children: [sidebarOpen && (_jsx("div", { className: "fixed inset-0 z-20 bg-black/40 lg:hidden", onClick: () => setSidebarOpen(false) })), _jsx("aside", { className: [
                    'fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:hidden',
                    sidebarOpen ? 'flex translate-x-0' : 'flex -translate-x-full',
                ].join(' '), children: _jsx(SidebarContent, {}) }), _jsx("aside", { className: "hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex", children: _jsx(SidebarContent, {}) }), _jsxs("div", { className: "flex flex-1 flex-col overflow-hidden", children: [_jsxs("header", { className: "flex h-14 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:hidden", children: [_jsx("button", { onClick: () => setSidebarOpen(true), className: "rounded-lg p-2 text-gray-500 hover:bg-gray-100", "aria-label": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043C\u0435\u043D\u044E", children: _jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) }) }), _jsx(LogoLink, { clickable: true, size: "sm" })] }), _jsx("main", { className: "flex-1 overflow-y-auto", children: _jsx("div", { className: "mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8", children: _jsx(Outlet, {}) }) })] })] }));
}
