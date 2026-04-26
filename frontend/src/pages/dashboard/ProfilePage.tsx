import React, { useState } from 'react';
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

type EmailForm = z.infer<typeof EmailSchema>;
type PasswordForm = z.infer<typeof PasswordSchema>;

// ── Компонент ─────────────────────────────────────────────────────────────────

export function ProfilePage() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'email' | 'password'>('email');

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: () => profileApi.get().then((r) => r.data.data),
    });

    // ── Форма смены email ─────────────────────────────────────────────────────

    const emailForm = useForm<EmailForm>({
        resolver: zodResolver(EmailSchema),
        values: { email: profile?.email ?? '', currentPassword: '' },
    });

    const emailMutation = useMutation({
        mutationFn: (data: EmailForm) => profileApi.updateEmail(data),
        onSuccess: () => {
            toast.success('Email успешно обновлён');
            emailForm.reset({ email: emailForm.getValues('email'), currentPassword: '' });
        },
        onError: (err: unknown) => {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data
                    ?.message ?? 'Ошибка при обновлении email';
            toast.error(msg);
        },
    });

    // ── Форма смены пароля ────────────────────────────────────────────────────

    const passwordForm = useForm<PasswordForm>({
        resolver: zodResolver(PasswordSchema),
    });

    const passwordMutation = useMutation({
        mutationFn: (data: PasswordForm) =>
            profileApi.updatePassword({
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
        onError: (err: unknown) => {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data
                    ?.message ?? 'Ошибка при смене пароля';
            toast.error(msg);
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="max-w-lg space-y-6">
            {/* Заголовок */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Профиль</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Управление данными аккаунта
                </p>
            </div>

            {/* Инфо-карточка */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
                        {profile?.email[0]?.toUpperCase()}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{profile?.email}</p>
                        <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              {profile?.role}
            </span>
                    </div>
                </div>
                <p className="mt-3 text-xs text-gray-400">
                    Аккаунт создан:{' '}
                    {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                        })
                        : '—'}
                </p>
            </div>

            {/* Табы */}
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                {(['email', 'password'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={[
                            'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                            activeTab === tab
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700',
                        ].join(' ')}
                    >
                        {tab === 'email' ? 'Сменить email' : 'Сменить пароль'}
                    </button>
                ))}
            </div>

            {/* Форма смены email */}
            {activeTab === 'email' && (
                <form
                    onSubmit={emailForm.handleSubmit((d) => emailMutation.mutate(d))}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
                >
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Новый email
                        </label>
                        <input
                            {...emailForm.register('email')}
                            type="email"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        {emailForm.formState.errors.email && (
                            <p className="mt-1 text-xs text-red-600">
                                {emailForm.formState.errors.email.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Текущий пароль
                        </label>
                        <input
                            {...emailForm.register('currentPassword')}
                            type="password"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        {emailForm.formState.errors.currentPassword && (
                            <p className="mt-1 text-xs text-red-600">
                                {emailForm.formState.errors.currentPassword.message}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={emailMutation.isPending}
                        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {emailMutation.isPending ? 'Сохранение...' : 'Сохранить email'}
                    </button>
                </form>
            )}

            {/* Форма смены пароля */}
            {activeTab === 'password' && (
                <form
                    onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
                >
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Текущий пароль
                        </label>
                        <input
                            {...passwordForm.register('currentPassword')}
                            type="password"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        {passwordForm.formState.errors.currentPassword && (
                            <p className="mt-1 text-xs text-red-600">
                                {passwordForm.formState.errors.currentPassword.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Новый пароль
                        </label>
                        <input
                            {...passwordForm.register('newPassword')}
                            type="password"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        {passwordForm.formState.errors.newPassword && (
                            <p className="mt-1 text-xs text-red-600">
                                {passwordForm.formState.errors.newPassword.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Подтверждение пароля
                        </label>
                        <input
                            {...passwordForm.register('confirmPassword')}
                            type="password"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        {passwordForm.formState.errors.confirmPassword && (
                            <p className="mt-1 text-xs text-red-600">
                                {passwordForm.formState.errors.confirmPassword.message}
                            </p>
                        )}
                    </div>

                    <div className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700">
                        ⚠ После смены пароля вы будете автоматически разлогинены на всех устройствах
                    </div>

                    <button
                        type="submit"
                        disabled={passwordMutation.isPending}
                        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {passwordMutation.isPending ? 'Сохранение...' : 'Сменить пароль'}
                    </button>
                </form>
            )}
        </div>
    );
}