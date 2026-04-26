import React from 'react';
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
import { NotFoundPage } from './pages/NotFoundPage';
import { Toaster } from 'react-hot-toast';
import { ItemDetail } from './pages/dashboard/ItemDetail';
import { ProfilePage } from './pages/dashboard/ProfilePage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 30_000,
        },
    },
});

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrowserRouter>
                    <Toaster
                        position="top-right"
                        toastOptions={{
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
                        }}
                    />
                    <Routes>
                        {/* Публичные маршруты */}
                        <Route path="/" element={<TrackPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* Защищённый дашборд */}
                        <Route
                            path="/dashboard"
                            element={
                                <RequireRole roles={['SELLER', 'ADMIN', 'CUSTOMER']}>
                                    <DashboardLayout />
                                </RequireRole>
                            }
                        >
                            {/* Доступно всем ролям */}
                            <Route
                                path="profile"
                                element={
                                    <RequireRole roles={['SELLER', 'ADMIN', 'CUSTOMER']}>
                                        <ProfilePage />
                                    </RequireRole>
                                }
                            />

                            {/* Индекс — редирект по роли */}
                            <Route index element={<DashboardIndex />} />

                            {/* Маршруты продавца */}
                            <Route
                                path="seller/items"
                                element={
                                    <RequireRole roles={['SELLER']}>
                                        <SellerItems />
                                    </RequireRole>
                                }
                            />

                            <Route
                                path="seller/items/:id"
                                element={
                                    <RequireRole roles={['SELLER']}>
                                        <ItemDetail />
                                    </RequireRole>
                                }
                            />

                            <Route
                                path="seller/create"
                                element={
                                    <RequireRole roles={['SELLER']}>
                                        <CreateItem />
                                    </RequireRole>
                                }
                            />

                            {/* Маршруты администратора */}
                            <Route
                                path="admin/items"
                                element={
                                    <RequireRole roles={['ADMIN']}>
                                        <AdminItems />
                                    </RequireRole>
                                }
                            />

                            {/* Маршруты покупателя */}
                            <Route
                                path="customer/orders"
                                element={
                                    <RequireRole roles={['CUSTOMER']}>
                                        <CustomerOrders />
                                    </RequireRole>
                                }
                            />
                        </Route>

                        {/* Fallback */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    );
}