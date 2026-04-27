import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { profileApi } from '@/api/profile';
import { useAuth } from '@/hooks/useAuth';
// ── Схемы ────────────────────────────────────────────────────────────────────
const EmailSchema = z.object({
    email: z.string().email('Некорректный email'),
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
});
const PasswordSchema = z
    .object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: z
        .string()
        .min(8, 'Минимум 8 символов')
        .regex(/[A-Z]/, 'Нужна заглавная буква')
        .regex(/[0-9]/, 'Нужна цифра'),
    confirmPassword: z.string(),
})
    .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
});
// ── Компонент ─────────────────────────────────────────────────────────────────
export function ProfilePage() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('email');
    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: () => profileApi.get().then((r) => r.data.data),
    });
    // ── Форма смены email ─────────────────────────────────────────────────────
    const emailForm = useForm({
        resolver: zodResolver(EmailSchema),
        values: { email: profile?.email ?? '', currentPassword: '' },
    });
    const emailMutation = useMutation({
        mutationFn: (data) => profileApi.updateEmail(data),
        onSuccess: () => {
            toast.success('Email успешно обновлён');
            emailForm.reset({ email: emailForm.getValues('email'), currentPassword: '' });
        },
        onError: (err) => {
            const msg = err?.response?.data
                ?.message ?? 'Ошибка при обновлении email';
            toast.error(msg);
        },
    });
    // ── Форма смены пароля ────────────────────────────────────────────────────
    const passwordForm = useForm({
        resolver: zodResolver(PasswordSchema),
    });
    const passwordMutation = useMutation({
        mutationFn: (data) => profileApi.updatePassword({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
        }),
        onSuccess: async () => {
            toast.success('Пароль изменён. Выполняется выход...');
            // После смены пароля все токены инвалидированы — разлогиниваем
            setTimeout(async () => {
                await logout();
                navigate('/login', { replace: true });
            }, 1500);
        },
        onError: (err) => {
            const msg = err?.response?.data
                ?.message ?? 'Ошибка при смене пароля';
            toast.error(msg);
        },
    });
    if (isLoading) {
        return (_jsx("div", { className: "flex h-64 items-center justify-center", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" }) }));
    }
    return (_jsxs("div", { className: "max-w-lg space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0434\u0430\u043D\u043D\u044B\u043C\u0438 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430" })] }), _jsxs("div", { className: "rounded-xl border border-gray-200 bg-white p-5 shadow-sm", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600", children: profile?.email[0]?.toUpperCase() }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: profile?.email }), _jsx("span", { className: "inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700", children: profile?.role })] })] }), _jsxs("p", { className: "mt-3 text-xs text-gray-400", children: ["\u0410\u043A\u043A\u0430\u0443\u043D\u0442 \u0441\u043E\u0437\u0434\u0430\u043D:", ' ', profile?.createdAt
                                ? new Date(profile.createdAt).toLocaleDateString('ru-RU', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                })
                                : '—'] })] }), _jsx("div", { className: "flex rounded-lg border border-gray-200 bg-gray-50 p-1", children: ['email', 'password'].map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab), className: [
                        'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                        activeTab === tab
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700',
                    ].join(' '), children: tab === 'email' ? 'Сменить email' : 'Сменить пароль' }, tab))) }), activeTab === 'email' && (_jsxs("form", { onSubmit: emailForm.handleSubmit((d) => emailMutation.mutate(d)), className: "rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "\u041D\u043E\u0432\u044B\u0439 email" }), _jsx("input", { ...emailForm.register('email'), type: "email", className: "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" }), emailForm.formState.errors.email && (_jsx("p", { className: "mt-1 text-xs text-red-600", children: emailForm.formState.errors.email.message }))] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u043F\u0430\u0440\u043E\u043B\u044C" }), _jsx("input", { ...emailForm.register('currentPassword'), type: "password", className: "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" }), emailForm.formState.errors.currentPassword && (_jsx("p", { className: "mt-1 text-xs text-red-600", children: emailForm.formState.errors.currentPassword.message }))] }), _jsx("button", { type: "submit", disabled: emailMutation.isPending, className: "w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors", children: emailMutation.isPending ? 'Сохранение...' : 'Сохранить email' })] })), activeTab === 'password' && (_jsxs("form", { onSubmit: passwordForm.handleSubmit((d) => passwordMutation.mutate(d)), className: "rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u043F\u0430\u0440\u043E\u043B\u044C" }), _jsx("input", { ...passwordForm.register('currentPassword'), type: "password", className: "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" }), passwordForm.formState.errors.currentPassword && (_jsx("p", { className: "mt-1 text-xs text-red-600", children: passwordForm.formState.errors.currentPassword.message }))] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "\u041D\u043E\u0432\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C" }), _jsx("input", { ...passwordForm.register('newPassword'), type: "password", className: "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" }), passwordForm.formState.errors.newPassword && (_jsx("p", { className: "mt-1 text-xs text-red-600", children: passwordForm.formState.errors.newPassword.message }))] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u043F\u0430\u0440\u043E\u043B\u044F" }), _jsx("input", { ...passwordForm.register('confirmPassword'), type: "password", className: "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" }), passwordForm.formState.errors.confirmPassword && (_jsx("p", { className: "mt-1 text-xs text-red-600", children: passwordForm.formState.errors.confirmPassword.message }))] }), _jsx("div", { className: "rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700", children: "\u26A0 \u041F\u043E\u0441\u043B\u0435 \u0441\u043C\u0435\u043D\u044B \u043F\u0430\u0440\u043E\u043B\u044F \u0432\u044B \u0431\u0443\u0434\u0435\u0442\u0435 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0440\u0430\u0437\u043B\u043E\u0433\u0438\u043D\u0435\u043D\u044B \u043D\u0430 \u0432\u0441\u0435\u0445 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430\u0445" }), _jsx("button", { type: "submit", disabled: passwordMutation.isPending, className: "w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors", children: passwordMutation.isPending ? 'Сохранение...' : 'Сменить пароль' })] }))] }));
}
