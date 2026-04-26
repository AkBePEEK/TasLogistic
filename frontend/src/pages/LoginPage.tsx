import React, {useState} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import toast from "react-hot-toast";
import {LogoLink} from "@/components/LogoLink";

const Schema = z.object({
    email: z.string().email('Некорректный email'),
    password: z.string().min(1, 'Введите пароль'),
});
type Form = z.infer<typeof Schema>;

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<Form>({ resolver: zodResolver(Schema) });

    const onSubmit = async (values: Form) => {
        try {
            await login(values.email, values.password);
            toast.success('Добро пожаловать!'); // ← добавить
            navigate(from, { replace: true });
        } catch {
            setError('root', { message: 'Неверный email или пароль' });
            toast.error('Неверный email или пароль'); // ← добавить
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="mb-8 flex justify-center items-center">
                        <div className="rounded-2xl bg-white px-6 py-4 shadow-sm border border-gray-100">
                            <LogoLink clickable={false} size="lg" />
                        </div>
                    </div>
                    <h1 className="mt-2 text-xl font-semibold text-gray-900">Вход в аккаунт</h1>
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

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                        <input
                            {...register('email')}
                            type="email"
                            autoComplete="email"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        {errors.email && (
                            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Пароль</label>
                        <div className="relative">
                            <input
                                {...register('password')}
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? (
                                    // Глаз закрытый
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    // Глаз открытый
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? 'Вход...' : 'Войти'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-500">
                    Нет аккаунта?{' '}
                    <Link to="/register" className="font-medium text-indigo-600 hover:underline">
                        Зарегистрироваться
                    </Link>
                </p>
            </div>
        </div>
    );
}