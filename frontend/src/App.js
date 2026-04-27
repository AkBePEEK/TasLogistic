import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { RequireRole } from './components/RequireRole';
import { DashboardLayout } from './layouts/DashboardLayout';
import { TrackPage } from './pages/TrackPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardIndex } from './pages/dashboard/DashboardIndex';
import { SellerItems } from './pages/dashboard/seller/SellerItems';
import { CreateItem } from './pages/dashboard/seller/CreateItem';
import { AdminItems } from './pages/dashboard/admin/AdminItems';
import { CustomerOrders } from './pages/dashboard/customer/CustomerOrder';
import { NotFoundPage } from "@/pages/NotFoundPage";
import { Toaster } from "react-hot-toast";
import { ItemDetail } from "@/pages/dashboard/ItemDetail";
import { ProfilePage } from "@/pages/dashboard/ProfilePage";
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 30000,
        },
    },
});
export default function App() {
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(AuthProvider, { children: _jsxs(BrowserRouter, { children: [_jsx(Toaster, { position: "top-right", toastOptions: {
                            duration: 3000,
                            style: {
                                borderRadius: '10px',
                                fontSize: '14px',
                            },
                            success: {
                                style: {
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    color: '#166534',
                                },
                            },
                            error: {
                                style: {
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    color: '#991b1b',
                                },
                            },
                        } }), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(TrackPage, {}) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsxs(Route, { path: "/dashboard", element: _jsx(RequireRole, { roles: ['SELLER', 'ADMIN', 'CUSTOMER'], children: _jsx(DashboardLayout, {}) }), children: [_jsx(Route, { path: "profile", element: _jsx(RequireRole, { roles: ['SELLER', 'ADMIN', 'CUSTOMER'], children: _jsx(ProfilePage, {}) }) }), _jsx(Route, { index: true, element: _jsx(DashboardIndex, {}) }), _jsx(Route, { path: "seller/items", element: _jsx(RequireRole, { roles: ['SELLER'], children: _jsx(SellerItems, {}) }) }), _jsx(Route, { path: "seller/items/:id", element: _jsx(RequireRole, { roles: ['SELLER'], children: _jsx(ItemDetail, {}) }) }), _jsx(Route, { path: "seller/create", element: _jsx(RequireRole, { roles: ['SELLER'], children: _jsx(CreateItem, {}) }) }), _jsx(Route, { path: "admin/items", element: _jsx(RequireRole, { roles: ['ADMIN'], children: _jsx(AdminItems, {}) }) }), _jsx(Route, { path: "customer/orders", element: _jsx(RequireRole, { roles: ['CUSTOMER'], children: _jsx(CustomerOrders, {}) }) })] }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] })] }) }) }));
}
