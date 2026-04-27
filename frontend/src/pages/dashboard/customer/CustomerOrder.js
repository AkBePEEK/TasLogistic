import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customerApi } from '@/api/customer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { OrderHistoryDrawer } from './OrderHistoryDrawer';
import toast from "react-hot-toast";
// ── Форма добавления трек-кода ────────────────────────────────────────────────
const AddTrackSchema = z.object({
    trackingCode: z
        .string()
        .min(6, 'Минимум 6 символов')
        .max(64)
        .regex(/^[A-Z0-9-]+$/, 'Только заглавные буквы, цифры и дефис')
        .transform((v) => v.toUpperCase()),
});
// ── Главная страница ──────────────────────────────────────────────────────────
export function CustomerOrders() {
    const qc = useQueryClient();
    const [selectedItemId, setSelectedItemId] = useState(null);
    // Загружаем полный список — без пагинации
    const { data, isLoading } = useQuery({
        queryKey: ['customer-tracked'],
        queryFn: () => customerApi.getTracked().then((r) => r.data.data),
    });
    // Форма добавления трек-кода
    const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting }, } = useForm({ resolver: zodResolver(AddTrackSchema) });
    const addMutation = useMutation({
        mutationFn: (code) => customerApi.addTracked(code),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['customer-tracked'] });
            reset();
            toast.success('Заказ добавлен в отслеживание'); // ← добавить
        },
        onError: (err) => {
            const msg = err?.response?.data
                ?.message ?? 'Товар не найден';
            setError('trackingCode', { message: msg });
            toast.error(msg); // ← добавить
        },
    });
    const removeMutation = useMutation({
        mutationFn: (itemId) => customerApi.removeTracked(itemId),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['customer-tracked'] });
            toast.success('Заказ удалён из отслеживания'); // ← добавить
        },
        onError: () => {
            toast.error('Не удалось удалить заказ'); // ← добавить
        },
    });
    const onAddSubmit = (values) => addMutation.mutate(values.trackingCode);
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "flex items-end justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "\u041C\u043E\u0438 \u0437\u0430\u043A\u0430\u0437\u044B" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "\u0412\u0441\u044F \u0438\u0441\u0442\u043E\u0440\u0438\u044F \u0432\u0430\u0448\u0438\u0445 \u043E\u0442\u0441\u043B\u0435\u0436\u0438\u0432\u0430\u0435\u043C\u044B\u0445 \u0442\u043E\u0432\u0430\u0440\u043E\u0432" })] }), data && (_jsxs("span", { className: "text-sm text-gray-400", children: [data.total, " ", pluralize(data.total, 'заказ', 'заказа', 'заказов')] }))] }), _jsxs("form", { onSubmit: handleSubmit(onAddSubmit), className: "rounded-xl border border-gray-200 bg-white p-5 shadow-sm", children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700", children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u043A\u0430\u0437 \u043F\u043E \u0442\u0440\u0435\u043A-\u043A\u043E\u0434\u0443" }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("input", { ...register('trackingCode'), placeholder: "TRK-123456", autoComplete: "off", spellCheck: false, className: "w-full rounded-lg border border-gray-300 px-3 py-2.5 font-mono text-sm uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:font-sans placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" }), errors.trackingCode && (_jsxs("p", { className: "mt-1.5 flex items-center gap-1 text-xs text-red-600", children: [_jsx("span", { children: "\u26A0" }), " ", errors.trackingCode.message] }))] }), _jsx("button", { type: "submit", disabled: isSubmitting || addMutation.isPending, className: "rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50", children: addMutation.isPending ? (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("span", { className: "h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" }), "\u041F\u043E\u0438\u0441\u043A..."] })) : ('Отслеживать') })] })] }), isLoading ? (_jsx(LoadingState, {})) : data?.items.length === 0 ? (_jsx(EmptyState, {})) : (_jsx("div", { className: "space-y-3", children: data?.items.map((item) => (_jsx(OrderCard, { item: item, onShowHistory: () => setSelectedItemId(item.id), onRemove: () => removeMutation.mutate(item.id), isRemoving: removeMutation.isPending && removeMutation.variables === item.id }, item.trackedItemId))) })), selectedItemId && (_jsx(OrderHistoryDrawer, { itemId: selectedItemId, onClose: () => setSelectedItemId(null) }))] }));
}
// ── Вспомогательные компоненты ────────────────────────────────────────────────
function LoadingState() {
    return (_jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => (_jsx("div", { className: "h-24 animate-pulse rounded-xl border border-gray-100 bg-gray-50" }, i))) }));
}
function EmptyState() {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-center", children: [_jsx("div", { className: "mb-3 text-4xl", children: "\uD83D\uDCE6" }), _jsx("p", { className: "text-sm font-medium text-gray-600", children: "\u041D\u0435\u0442 \u043E\u0442\u0441\u043B\u0435\u0436\u0438\u0432\u0430\u0435\u043C\u044B\u0445 \u0437\u0430\u043A\u0430\u0437\u043E\u0432" }), _jsx("p", { className: "mt-1 text-xs text-gray-400", children: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0440\u0435\u043A-\u043A\u043E\u0434 \u0432\u044B\u0448\u0435, \u0447\u0442\u043E\u0431\u044B \u043D\u0430\u0447\u0430\u0442\u044C \u043E\u0442\u0441\u043B\u0435\u0436\u0438\u0432\u0430\u0442\u044C \u0437\u0430\u043A\u0430\u0437" })] }));
}
function OrderCard({ item, onShowHistory, onRemove, isRemoving }) {
    // Хронология для превью — от старых к новым, максимум 4 шага
    const timeline = [...item.statusHistory].reverse().slice(0, 4);
    return (_jsx("div", { className: "group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("span", { className: "font-mono text-sm font-semibold text-indigo-600 tracking-wider", children: item.trackingCode }), _jsx(StatusBadge, { status: item.currentStatus })] }), _jsx("p", { className: "mt-1 truncate text-sm font-medium text-gray-900", children: item.title }), timeline.length > 0 && (_jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-1", children: [timeline.map((step, i) => (_jsxs(React.Fragment, { children: [i > 0 && (_jsx("span", { className: "text-gray-300 text-xs select-none", children: "\u203A" })), _jsx(StatusChip, { status: step.newStatus })] }, i))), item.statusHistory.length > 4 && (_jsxs("span", { className: "text-xs text-gray-400", children: ["+", item.statusHistory.length - 4, " \u0435\u0449\u0451"] }))] })), _jsxs("p", { className: "mt-2 text-xs text-gray-400", children: ["\u041E\u0431\u043D\u043E\u0432\u043B\u0451\u043D:", ' ', new Date(item.updatedAt).toLocaleString('ru-RU', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })] })] }), _jsxs("div", { className: "flex flex-shrink-0 flex-col gap-2", children: [_jsx("button", { onClick: onShowHistory, className: "rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300", children: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u2192" }), _jsx("button", { onClick: onRemove, disabled: isRemoving, className: "rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-100 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-red-200", children: isRemoving ? '...' : 'Удалить' })] })] }) }));
}
/** Мини-чип статуса для хронологии в карточке */
function StatusChip({ status }) {
    const CHIP = {
        CREATED: 'bg-gray-100 text-gray-500',
        PROCESSING: 'bg-blue-50 text-blue-600',
        SHIPPED: 'bg-yellow-50 text-yellow-600',
        IN_TRANSIT: 'bg-orange-50 text-orange-600',
        DELIVERED: 'bg-green-50 text-green-700',
        CANCELLED: 'bg-red-50 text-red-500',
    };
    const LABEL = {
        CREATED: 'Создан',
        PROCESSING: 'Обработка',
        SHIPPED: 'Отправлен',
        IN_TRANSIT: 'В пути',
        DELIVERED: 'Доставлен',
        CANCELLED: 'Отменён',
    };
    return (_jsx("span", { className: `rounded px-1.5 py-0.5 text-xs font-medium ${CHIP[status]}`, children: LABEL[status] }));
}
// ── Утилита ───────────────────────────────────────────────────────────────────
function pluralize(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19)
        return many;
    if (mod10 === 1)
        return one;
    if (mod10 >= 2 && mod10 <= 4)
        return few;
    return many;
}
