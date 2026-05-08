import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/types';
import {LogoLink} from "@/components/LogoLink";
import {useTranslation} from "react-i18next";

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
}

const { t } = useTranslation();

const Schema = z
    .object({
        email: z.string().email('Некорректный email'),
        password: z
            .string()
            .min(8, 'Минимум 8 символов')
            .regex(/[A-Z]/, 'Нужна заглавная буква')
            .regex(/[0-9]/, 'Нужна цифра'),
        confirm: z.string(),
    })
    .refine((d) => d.password === d.confirm, {
        message: 'Пароли не совпадают',
        path: ['confirm'],
    });
type Form = z.infer<typeof Schema>;

const ROLES: { value: Role; label: string; icon: string; desc: string }[] = [
    { value: 'CUSTOMER', icon: '📦', label: t('register.customer.label'),  desc: t('register.customer.desc') },
    { value: 'SELLER',   icon: '🏪', label: t('register.seller.label'),   desc: t('register.seller.desc') },
];

export function RegisterPage() {
    const { register: authRegister } = useAuth();
    const navigate = useNavigate();
    const [role, setRole] = useState<Role>('CUSTOMER');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<Form>({ resolver: zodResolver(Schema) });

    const onSubmit = async (values: Form) => {
        try {
            await authRegister(values.email, values.password, role);
            navigate('/dashboard', { replace: true });
        } catch {
            setError('root', { message: 'Ошибка регистрации. Возможно, email уже используется.' });
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="mb-8 flex justify-center items-center">
                        <div className="rounded-2xl bg-white px-6 py-4 shadow-sm border border-gray-100">
                            <LogoLink clickable={false} size="lg" />
                        </div>
                    </div>
                    <h1 className="mt-2 text-xl font-semibold text-gray-900">{t('register.title')}</h1>
                </div>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
                >
                    {errors.root && (
                        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            {errors.root.message}
                        </div>
                    )}

                    {/* Выбор роли */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            {t('register.role')}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {ROLES.map((r) => (
                                <button
                                    key={r.value}
                                    type="button"
                                    onClick={() => setRole(r.value)}
                                    className={[
                                        'rounded-lg border-2 p-3 text-left transition-colors',
                                        role === r.value
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-gray-200 hover:border-gray-300',
                                    ].join(' ')}
                                >
                                    <div className="text-xl">{r.icon}</div>
                                    <div className="mt-1 text-sm font-semibold text-gray-800">{r.label}</div>
                                    <div className="text-xs text-gray-400">{r.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                        <input
                            {...register('email')}
                            type="email"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        {errors.email && (
                            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">{t('register.password')}</label>
                        <div className="relative">
                            <input
                                {...register('password')}
                                type={showPassword ? 'text' : 'password'}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <EyeIcon open={showPassword} />
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('register.confirm')}
                        </label>
                        <div className="relative">
                            <input
                                {...register('confirm')}
                                type={showConfirm ? 'text' : 'password'}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <EyeIcon open={showConfirm} />
                            </button>
                        </div>
                        {errors.confirm && (
                            <p className="mt-1 text-xs text-red-600">{errors.confirm.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? t('register.loading') : t('register.confirm')}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-500">
                    {t('register.hasAccount') + ' '}
                    <Link to="/login" className="font-medium text-indigo-600 hover:underline">
                        {t('register.loginLink')}
                    </Link>
                </p>
            </div>
        </div>
    );
}