import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';

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
    { value: 'CUSTOMER', icon: '📦', label: 'Покупатель', desc: 'Отслеживаю свои заказы' },
    { value: 'SELLER',   icon: '🏪', label: 'Продавец',   desc: 'Управляю товарами' },
];

export function RegisterPage() {
    const { register: authRegister } = useAuth();
    const navigate = useNavigate();
    const [role, setRole] = useState<Role>('CUSTOMER');

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
        <span className="text-2xl font-bold text-indigo-600">TrackApp</span>
            <h1 className="mt-2 text-xl font-semibold text-gray-900">Создать аккаунт</h1>
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
        Я регистрируюсь как
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
    <label className="mb-1 block text-sm font-medium text-gray-700">Пароль</label>
        <input
    {...register('password')}
    type="password"
    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
    />
    {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
        )}
    </div>

    <div>
    <label className="mb-1 block text-sm font-medium text-gray-700">
        Подтверждение пароля
    </label>
    <input
    {...register('confirm')}
    type="password"
    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        {errors.confirm && (
                <p className="mt-1 text-xs text-red-600">{errors.confirm.message}</p>
            )}
        </div>

        <button
    type="submit"
    disabled={isSubmitting}
    className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
        {isSubmitting ? 'Создание...' : 'Зарегистрироваться'}
        </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
        Войти
        </Link>
        </p>
        </div>
        </div>
);
}