import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { sellerApi } from '@/api/seller';
import { StatusBadge } from '@/components/ui/StatusBadge';
const STATUSES = [
    'CREATED',
    'PROCESSING',
    'SHIPPED',
    'IN_TRANSIT',
    'DELIVERED',
    'CANCELLED',
];
const STATUS_DOT = {
    CREATED: 'bg-gray-400',
    PROCESSING: 'bg-blue-500',
    SHIPPED: 'bg-yellow-500',
    IN_TRANSIT: 'bg-orange-500',
    DELIVERED: 'bg-green-500',
    CANCELLED: 'bg-red-400',
};
export function ItemDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [editingStatus, setEditingStatus] = useState(false);
    const { data: item, isLoading, isError } = useQuery({
        queryKey: ['seller-item', id],
        queryFn: () => sellerApi.getItemById(id).then((r) => r.data.data),
        enabled: !!id,
    });
    const statusMutation = useMutation({
        mutationFn: (status) => sellerApi.updateStatus(id, status),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['seller-item', id] });
            void qc.invalidateQueries({ queryKey: ['seller-items'] });
            setEditingStatus(false);
            toast.success('Статус обновлён');
        },
        onError: () => toast.error('Не удалось обновить статус'),
    });
    if (isLoading) {
        return (_jsx("div", { className: "flex h-64 items-center justify-center", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" }) }));
    }
    if (isError || !item) {
        return (_jsxs("div", { className: "rounded-xl bg-red-50 p-6 text-center", children: [_jsx("p", { className: "text-sm text-red-700", children: "\u0422\u043E\u0432\u0430\u0440 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" }), _jsx(Link, { to: "/dashboard/seller/items", className: "mt-3 inline-block text-sm text-indigo-600 hover:underline", children: "\u2190 \u041D\u0430\u0437\u0430\u0434 \u043A \u0441\u043F\u0438\u0441\u043A\u0443" })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: () => navigate('/dashboard/seller/items'), className: "text-sm text-gray-400 hover:text-gray-600 transition-colors", children: "\u2190 \u041D\u0430\u0437\u0430\u0434" }), _jsx("h1", { className: "text-2xl font-bold text-gray-900 truncate", children: item.title })] }), _jsx("div", { className: "rounded-xl border border-gray-200 bg-white p-6 shadow-sm", children: _jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-wider text-gray-400", children: "\u0422\u0440\u0435\u043A-\u043A\u043E\u0434" }), _jsx("p", { className: "mt-1 font-mono text-lg font-bold text-indigo-600", children: item.trackingCode })] }), item.description && (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-wider text-gray-400", children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx("p", { className: "mt-1 text-sm text-gray-700", children: item.description })] })), _jsxs("div", { className: "flex gap-6 text-xs text-gray-400", children: [_jsxs("span", { children: ["\u0421\u043E\u0437\u0434\u0430\u043D: ", new Date(item.createdAt).toLocaleDateString('ru-RU')] }), _jsxs("span", { children: ["\u041E\u0431\u043D\u043E\u0432\u043B\u0451\u043D: ", new Date(item.updatedAt).toLocaleString('ru-RU')] })] })] }), _jsxs("div", { className: "flex flex-col items-end gap-3", children: [_jsx(StatusBadge, { status: item.currentStatus, large: true }), editingStatus ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("select", { defaultValue: item.currentStatus, onChange: (e) => statusMutation.mutate(e.target.value), disabled: statusMutation.isPending, className: "rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200", children: STATUSES.map((s) => (_jsx("option", { value: s, children: s }, s))) }), _jsx("button", { onClick: () => setEditingStatus(false), className: "text-xs text-gray-400 hover:text-gray-600", children: "\u041E\u0442\u043C\u0435\u043D\u0430" })] })) : (_jsx("button", { onClick: () => setEditingStatus(true), className: "rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors", children: "\u0421\u043C\u0435\u043D\u0438\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441" }))] })] }) }), _jsxs("div", { className: "rounded-xl border border-gray-200 bg-white p-6 shadow-sm", children: [_jsxs("h2", { className: "mb-5 text-sm font-semibold uppercase tracking-wider text-gray-400", children: ["\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439 \u2014 ", item.statusHistory.length, " \u0441\u043E\u0431\u044B\u0442\u0438\u0439"] }), item.statusHistory.length === 0 ? (_jsx("p", { className: "text-sm text-gray-400", children: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u043F\u0443\u0441\u0442\u0430" })) : (_jsx("ol", { className: "relative ml-2 border-l-2 border-gray-100", children: item.statusHistory.map((entry, idx) => {
                            const isLast = idx === item.statusHistory.length - 1;
                            return (_jsxs("li", { className: `relative ml-5 ${isLast ? 'pb-0' : 'pb-5'}`, children: [_jsx("span", { className: [
                                            'absolute -left-[25px] top-1 flex h-4 w-4 rounded-full ring-2 ring-white',
                                            STATUS_DOT[entry.newStatus],
                                        ].join(' ') }), _jsx("div", { className: "rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5", children: _jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [idx > 0 && (_jsxs("span", { className: "text-xs text-gray-400", children: [entry.oldStatus, " \u2192"] })), _jsx(StatusBadge, { status: entry.newStatus })] }), _jsx("time", { className: "text-xs tabular-nums text-gray-400", children: new Date(entry.changedAt).toLocaleString('ru-RU', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    }) })] }) })] }, entry.id));
                        }) }))] })] }));
}
