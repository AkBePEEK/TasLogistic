import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { sellerApi } from '@/api/seller';
import toast from "react-hot-toast";
const Schema = z.object({
    title: z.string().min(2, 'Минимум 2 символа').max(255),
    description: z.string().max(1000).optional(),
});
export function CreateItem() {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(Schema),
    });
    const mutation = useMutation({
        mutationFn: (data) => sellerApi.createItem(data).then((r) => r.data.data),
        onSuccess: (item) => {
            void qc.invalidateQueries({ queryKey: ['seller-items'] });
            toast.success(`Товар создан. Трек-код: ${item?.trackingCode}`); // ← добавить
            navigate('/dashboard/seller/items');
        },
        onError: () => {
            toast.error('Ошибка при создании товара'); // ← добавить
        },
    });
    return (_jsxs("div", { className: "max-w-lg space-y-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Link, { to: "/dashboard/seller/items", className: "text-sm text-gray-400 hover:text-gray-600", children: "\u2190 \u041D\u0430\u0437\u0430\u0434" }), _jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "\u041D\u043E\u0432\u044B\u0439 \u0442\u043E\u0432\u0430\u0440" })] }), _jsxs("form", { onSubmit: handleSubmit((d) => mutation.mutate(d)), className: "rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4", children: [_jsx("div", { className: "rounded-lg bg-indigo-50 px-4 py-3", children: _jsxs("p", { className: "text-xs text-indigo-600", children: ["\u0422\u0440\u0435\u043A-\u043A\u043E\u0434 \u0431\u0443\u0434\u0435\u0442 \u0441\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u043D \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435", ' ', _jsx("span", { className: "font-mono font-semibold", children: "TRK-YYYYMM-XXXXXXXX" })] }) }), _jsxs("div", { children: [_jsxs("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: ["\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { ...register('title'), placeholder: "\u041D\u043E\u0443\u0442\u0431\u0443\u043A Dell XPS 15", className: "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" }), errors.title && (_jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.title.message }))] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx("textarea", { ...register('description'), rows: 3, placeholder: "\u041D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435...", className: "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" })] }), mutation.isError && (_jsx("div", { className: "rounded-lg bg-red-50 p-3 text-sm text-red-700", children: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0442\u043E\u0432\u0430\u0440\u0430" })), _jsx("button", { type: "submit", disabled: mutation.isPending, className: "w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors", children: mutation.isPending ? 'Создание...' : 'Создать товар' })] })] }));
}
