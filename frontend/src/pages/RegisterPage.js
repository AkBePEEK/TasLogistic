import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogoLink } from "@/components/LogoLink";
function EyeIcon({ open }) {
    return open ? (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" }) })) : (_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })] }));
}
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
const ROLES = [
    { value: 'CUSTOMER', icon: '📦', label: 'Покупатель', desc: 'Отслеживаю свои заказы' },
    { value: 'SELLER', icon: '🏪', label: 'Продавец', desc: 'Управляю товарами' },
];
export function RegisterPage() {
    const { register: authRegister } = useAuth();
    const navigate = useNavigate();
    const [role, setRole] = useState('CUSTOMER');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { register, handleSubmit, setError, formState: { errors, isSubmitting }, } = useForm({ resolver: zodResolver(Schema) });
    const onSubmit = async (values) => {
        try {
            await authRegister(values.email, values.password, role);
            navigate('/dashboard', { replace: true });
        }
        catch {
            setError('root', { message: 'Ошибка регистрации. Возможно, email уже используется.' });
        }
    };
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8", children: _jsxs("div", { className: "w-full max-w-sm", children: [_jsxs("div", { className: "mb-8 text-center", children: [_jsx("div", { className: "mb-8 flex justify-center items-center", children: _jsx("div", { className: "rounded-2xl bg-white px-6 py-4 shadow-sm border border-gray-100", children: _jsx(LogoLink, { clickable: false, size: "lg" }) }) }), _jsx("h1", { className: "mt-2 text-xl font-semibold text-gray-900", children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442" })] }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4", children: [errors.root && (_jsx("div", { className: "rounded-lg bg-red-50 p-3 text-sm text-red-700", children: errors.root.message })), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700", children: "\u042F \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u0443\u044E\u0441\u044C \u043A\u0430\u043A" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: ROLES.map((r) => (_jsxs("button", { type: "button", onClick: () => setRole(r.value), className: [
                                            'rounded-lg border-2 p-3 text-left transition-colors',
                                            role === r.value
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:border-gray-300',
                                        ].join(' '), children: [_jsx("div", { className: "text-xl", children: r.icon }), _jsx("div", { className: "mt-1 text-sm font-semibold text-gray-800", children: r.label }), _jsx("div", { className: "text-xs text-gray-400", children: r.desc })] }, r.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "Email" }), _jsx("input", { ...register('email'), type: "email", className: "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" }), errors.email && (_jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.email.message }))] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "\u041F\u0430\u0440\u043E\u043B\u044C" }), _jsxs("div", { className: "relative", children: [_jsx("input", { ...register('password'), type: showPassword ? 'text' : 'password', className: "w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" }), _jsx("button", { type: "button", onClick: () => setShowPassword((v) => !v), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600", children: _jsx(EyeIcon, { open: showPassword }) })] }), errors.password && (_jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.password.message }))] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u043F\u0430\u0440\u043E\u043B\u044F" }), _jsxs("div", { className: "relative", children: [_jsx("input", { ...register('confirm'), type: showConfirm ? 'text' : 'password', className: "w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" }), _jsx("button", { type: "button", onClick: () => setShowConfirm((v) => !v), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600", children: _jsx(EyeIcon, { open: showConfirm }) })] }), errors.confirm && (_jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.confirm.message }))] }), _jsx("button", { type: "submit", disabled: isSubmitting, className: "w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors", children: isSubmitting ? 'Создание...' : 'Зарегистрироваться' })] }), _jsxs("p", { className: "mt-4 text-center text-sm text-gray-500", children: ["\u0423\u0436\u0435 \u0435\u0441\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442?", ' ', _jsx(Link, { to: "/login", className: "font-medium text-indigo-600 hover:underline", children: "\u0412\u043E\u0439\u0442\u0438" })] })] }) }));
}
