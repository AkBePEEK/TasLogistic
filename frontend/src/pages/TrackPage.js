import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LogoLink } from "@/components/LogoLink";
const Schema = z.object({
    code: z
        .string()
        .min(6, 'Минимум 6 символов')
        .max(64)
        .regex(/^[A-Z0-9-]+$/, 'Только заглавные буквы, цифры и дефис')
        .transform((v) => v.toUpperCase()),
});
export function TrackPage() {
    const [activeCode, setActiveCode] = useState(null);
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(Schema),
    });
    const { data, isLoading, isError } = useQuery({
        queryKey: ['track', activeCode],
        queryFn: () => apiClient
            .get(`/track/${activeCode}`)
            .then((r) => r.data.data),
        enabled: !!activeCode,
    });
    return (_jsxs("div", { className: "flex min-h-screen flex-col bg-gray-50", children: [_jsxs("header", { className: "flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4", children: [_jsx("div", { className: "mb-8 text-center", children: _jsx(LogoLink, { clickable: true, size: "md" }) }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Link, { to: "/login", className: "rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100", children: "\u0412\u043E\u0439\u0442\u0438" }), _jsx(Link, { to: "/register", className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700", children: "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F" })] })] }), _jsx("div", { className: "flex flex-1 flex-col items-center justify-center px-4 py-12", children: _jsxs("div", { className: "w-full max-w-lg", children: [_jsx("h1", { className: "mb-2 text-center text-3xl font-bold text-gray-900", children: "\u041E\u0442\u0441\u043B\u0435\u0434\u0438\u0442\u044C \u0437\u0430\u043A\u0430\u0437" }), _jsx("p", { className: "mb-8 text-center text-sm text-gray-500", children: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0440\u0435\u043A-\u043A\u043E\u0434 \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0441\u0442\u0430\u0442\u0443\u0441\u0430 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438" }), _jsxs("form", { onSubmit: handleSubmit((v) => setActiveCode(v.code)), className: "flex gap-2", children: [_jsx("input", { ...register('code'), placeholder: "TRK-202406-XXXXXXXX", className: "flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:font-sans focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" }), _jsx("button", { type: "submit", className: "rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors", children: "\u041D\u0430\u0439\u0442\u0438" })] }), errors.code && (_jsx("p", { className: "mt-1.5 text-xs text-red-600", children: errors.code.message })), isLoading && (_jsx("div", { className: "mt-8 flex justify-center", children: _jsx("div", { className: "h-6 w-6 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" }) })), isError && (_jsxs("div", { className: "mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700", children: ["\u0422\u043E\u0432\u0430\u0440 \u0441 \u0442\u0440\u0435\u043A-\u043A\u043E\u0434\u043E\u043C ", _jsx("strong", { children: activeCode }), " \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D."] })), data && (_jsxs("div", { className: "mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm", children: [_jsxs("div", { className: "mb-4 flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400", children: "\u0422\u0440\u0435\u043A-\u043A\u043E\u0434" }), _jsx("p", { className: "font-mono text-sm font-semibold", children: data.trackingCode })] }), _jsx(StatusBadge, { status: data.currentStatus, large: true })] }), _jsx("p", { className: "mb-5 font-semibold text-gray-900", children: data.title }), _jsx("p", { className: "mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400", children: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432" }), _jsx("ol", { className: "relative ml-2 border-l-2 border-gray-100", children: data.statusHistory.map((entry, i) => (_jsxs("li", { className: "relative ml-5 pb-4 last:pb-0", children: [_jsx("span", { className: "absolute -left-[25px] top-1 h-4 w-4 rounded-full bg-indigo-400 ring-2 ring-white" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(StatusBadge, { status: entry.newStatus }), _jsx("time", { className: "text-xs text-gray-400", children: new Date(entry.changedAt).toLocaleString('ru-RU', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        }) })] })] }, i))) })] }))] }) })] }));
}
