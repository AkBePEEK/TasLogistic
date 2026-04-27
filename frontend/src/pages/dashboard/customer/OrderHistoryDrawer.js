import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '@/api/customer';
import { StatusBadge } from '@/components/ui/StatusBadge';
const TIMELINE_DOT = {
    CREATED: 'bg-gray-400',
    PROCESSING: 'bg-blue-500',
    SHIPPED: 'bg-yellow-500',
    IN_TRANSIT: 'bg-orange-500',
    DELIVERED: 'bg-green-500',
    CANCELLED: 'bg-red-400',
};
export function OrderHistoryDrawer({ itemId, onClose }) {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['customer-history', itemId],
        queryFn: () => customerApi.getHistory(itemId).then((r) => r.data.data),
    });
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-40 bg-black/25 backdrop-blur-sm", onClick: onClose, "aria-hidden": "true" }), _jsxs("aside", { role: "dialog", "aria-modal": "true", "aria-label": "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0437\u0430\u043A\u0430\u0437\u0430", className: "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl", children: [_jsxs("div", { className: "flex items-start justify-between border-b border-gray-100 px-6 py-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-base font-bold text-gray-900", children: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0437\u0430\u043A\u0430\u0437\u0430" }), data && (_jsxs(_Fragment, { children: [_jsx("p", { className: "mt-0.5 font-mono text-xs font-semibold tracking-wider text-indigo-600", children: data.trackingCode }), _jsx("p", { className: "mt-0.5 text-sm text-gray-600", children: data.title })] }))] }), _jsx("button", { onClick: onClose, className: "ml-4 flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600", "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", children: _jsx("svg", { className: "h-4 w-4", viewBox: "0 0 16 16", fill: "currentColor", children: _jsx("path", { d: "M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z" }) }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto px-6 py-5", children: [isLoading && (_jsx("div", { className: "flex h-full items-center justify-center", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" }) })), isError && (_jsx("div", { className: "rounded-xl bg-red-50 p-4 text-sm text-red-700", children: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0438\u0441\u0442\u043E\u0440\u0438\u044E. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437." })), data && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3", children: [_jsx("span", { className: "text-sm font-medium text-gray-600", children: "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u0441\u0442\u0430\u0442\u0443\u0441" }), _jsx(StatusBadge, { status: data.currentStatus, large: true })] }), _jsxs("div", { children: [_jsxs("p", { className: "mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400", children: ["\u0425\u0440\u043E\u043D\u043E\u043B\u043E\u0433\u0438\u044F \u2014 ", data.statusHistory.length, ' ', pluralize(data.statusHistory.length, 'событие', 'события', 'событий')] }), _jsx("ol", { className: "relative ml-2 border-l-2 border-gray-100", children: data.statusHistory.map((entry, idx) => {
                                                    const isFirst = idx === 0;
                                                    const isLast = idx === data.statusHistory.length - 1;
                                                    return (_jsxs("li", { className: `relative ml-5 ${isLast ? 'pb-0' : 'pb-5'}`, children: [_jsx("span", { className: [
                                                                    'absolute -left-[25px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white',
                                                                    TIMELINE_DOT[entry.newStatus],
                                                                ].join(' ') }), _jsx("div", { className: "rounded-lg border border-gray-100 bg-white px-3 py-2.5 shadow-sm", children: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [!isFirst && (_jsxs("span", { className: "text-xs text-gray-300", children: [entry.oldStatus, " \u2192"] })), _jsx(StatusBadge, { status: entry.newStatus })] }), _jsx("time", { className: "flex-shrink-0 text-xs tabular-nums text-gray-400", children: new Date(entry.changedAt).toLocaleString('ru-RU', {
                                                                                day: '2-digit',
                                                                                month: 'short',
                                                                                year: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit',
                                                                            }) })] }) })] }, entry.id));
                                                }) })] }), _jsxs("div", { className: "rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500", children: [data.description && (_jsx("p", { className: "mb-3 text-sm text-gray-600", children: data.description })), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "\u0417\u0430\u043A\u0430\u0437 \u0441\u043E\u0437\u0434\u0430\u043D" }), _jsx("span", { className: "font-medium tabular-nums", children: new Date(data.createdAt).toLocaleDateString('ru-RU', {
                                                                    day: '2-digit',
                                                                    month: 'long',
                                                                    year: 'numeric',
                                                                }) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D \u0432 \u043E\u0442\u0441\u043B\u0435\u0436\u0438\u0432\u0430\u043D\u0438\u0435" }), _jsx("span", { className: "font-medium tabular-nums", children: new Date(data.addedAt).toLocaleDateString('ru-RU', {
                                                                    day: '2-digit',
                                                                    month: 'long',
                                                                    year: 'numeric',
                                                                }) })] })] })] })] }))] })] })] }));
}
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
