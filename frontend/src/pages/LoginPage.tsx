import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LogoLink } from '@/components/LogoLink';
import { apiClient } from '@/api/client';
import {useTranslation} from "react-i18next";

// Схемы валидации
const emailSchema = z.object({
    email: z.string().email('Некорректный email'),
    password: z.string().min(1, 'Введите пароль'),
});
type EmailForm = z.infer<typeof emailSchema>;

const phoneSchema = z.object({
    phone: z.string().min(10, 'Введите номер телефона'),
});
type PhoneForm = z.infer<typeof phoneSchema>;

const otpSchema = z.object({
    code: z.string().length(6, 'Код должен содержать 6 цифр'),
});
type OtpForm = z.infer<typeof otpSchema>;

type LoginMethod = 'email' | 'phone';
type PhoneStep = 'input' | 'otp';

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';

    const [showPassword, setShowPassword] = useState(false);
    const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
    const [phoneStep, setPhoneStep] = useState<PhoneStep>('input');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [timer, setTimer] = useState(0);
    const { t } = useTranslation();

    // Формы
    const emailForm = useForm<EmailForm>({
        resolver: zodResolver(emailSchema)
    });

    const phoneForm = useForm<PhoneForm>({
        resolver: zodResolver(phoneSchema)
    });

    const otpForm = useForm<OtpForm>({
        resolver: zodResolver(otpSchema)
    });

    // Мутация: запрос OTP
    const requestOtpMutation = useMutation({
        mutationFn: (phone: string) =>
            apiClient.post('/auth/login/phone/request', { phone }),
        onSuccess: () => {
            setPhoneStep('otp');
            setTimer(60);
            toast.success('Код отправлен');
        },
        onError: () => {
            toast.error('Ошибка отправки кода');
        },
    });

    // Мутация: верификация OTP
    const verifyOtpMutation = useMutation({
        mutationFn: (code: string) =>
            apiClient.post('/auth/login/phone/verify', {
                phone: phoneNumber,
                code
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['me'] });
            toast.success('Добро пожаловать!');
            navigate(from, { replace: true });
        },
        onError: () => {
            toast.error('Неверный код');
        },
    });

    // Таймер для повторной отправки
    React.useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((t) => t - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    // Обработчики
    const onEmailSubmit = async (values: EmailForm) => {
        try {
            await login(values.email, values.password);
            toast.success('Добро пожаловать!');
            navigate(from, { replace: true });
        } catch {
            toast.error(t('login.error'));
        }
    };

    const onPhoneSubmit = (values: PhoneForm) => {
        setPhoneNumber(values.phone);
        requestOtpMutation.mutate(values.phone);
    };

    const onOtpSubmit = (values: OtpForm) => {
        verifyOtpMutation.mutate(values.code);
    };

    const handleResendOtp = () => {
        if (timer === 0) {
            requestOtpMutation.mutate(phoneNumber);
        }
    };

    const switchMethod = (method: LoginMethod) => {
        setLoginMethod(method);
        setPhoneStep('input');
        setPhoneNumber('');
        setTimer(0);
        emailForm.reset();
        phoneForm.reset();
        otpForm.reset();
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
                    <h1 className="mt-2 text-xl font-semibold text-gray-900">{t('login.title')}</h1>
                </div>

                {/* Переключатель метода входа */}
                <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
                    <button
                        type="button"
                        onClick={() => switchMethod('email')}
                        className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                            loginMethod === 'email'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Email
                    </button>
                    <button
                        type="button"
                        onClick={() => switchMethod('phone')}
                        className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                            loginMethod === 'phone'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Телефон
                    </button>
                </div>

                {/* Email форма */}
                {loginMethod === 'email' && (
                    <form
                        onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
                    >
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                            <input
                                {...emailForm.register('email')}
                                type="email"
                                autoComplete="email"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                            {emailForm.formState.errors.email && (
                                <p className="mt-1 text-xs text-red-600">{emailForm.formState.errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">{t('login.password')}</label>
                            <div className="relative">
                                <input
                                    {...emailForm.register('password')}
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
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {emailForm.formState.errors.password && (
                                <p className="mt-1 text-xs text-red-600">{emailForm.formState.errors.password.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={emailForm.formState.isSubmitting}
                            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {emailForm.formState.isSubmitting ? t('login.loading') : t('login.submit')}
                        </button>
                    </form>
                )}

                {/* Phone форма */}
                {loginMethod === 'phone' && phoneStep === 'input' && (
                    <form
                        onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
                    >
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Номер телефона</label>
                            <input
                                {...phoneForm.register('phone')}
                                type="tel"
                                placeholder="+7 (___) ___-__-__"
                                autoComplete="tel"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                            {phoneForm.formState.errors.phone && (
                                <p className="mt-1 text-xs text-red-600">{phoneForm.formState.errors.phone.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={requestOtpMutation.isPending}
                            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {requestOtpMutation.isPending ? 'Отправка...' : 'Получить код'}
                        </button>
                    </form>
                )}

                {/* OTP форма */}
                {loginMethod === 'phone' && phoneStep === 'otp' && (
                    <form
                        onSubmit={otpForm.handleSubmit(onOtpSubmit)}
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
                    >
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Код из SMS</label>
                            <input
                                {...otpForm.register('code')}
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center text-2xl tracking-widest focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                            {otpForm.formState.errors.code && (
                                <p className="mt-1 text-xs text-red-600">{otpForm.formState.errors.code.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={verifyOtpMutation.isPending}
                            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {verifyOtpMutation.isPending ? t('login.loading') : t('login.submit')}
                        </button>

                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={timer > 0 || requestOtpMutation.isPending}
                            className="w-full text-sm text-indigo-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
                        >
                            {timer > 0
                                ? `Отправить код повторно через ${timer}с`
                                : 'Отправить код повторно'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setPhoneStep('input');
                                setPhoneNumber('');
                                setTimer(0);
                                phoneForm.reset();
                                otpForm.reset();
                            }}
                            className="w-full text-sm text-gray-500 hover:text-gray-700"
                        >
                            Изменить номер
                        </button>
                    </form>
                )}

                <p className="mt-4 text-center text-sm text-gray-500">
                    {t('login.noAccount') + ' '}
                    <Link to="/register" className="font-medium text-indigo-600 hover:underline">
                        {t('login.register')}
                    </Link>
                </p>
            </div>
        </div>
    );
}