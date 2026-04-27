import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { sellerApi } from '@/api/seller';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import toast from "react-hot-toast";
const STATUSES = ['CREATED', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
export function SellerItems() {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [editingId, setEditingId] = useState(null);
    const { data, isLoading } = useQuery({
        queryKey: ['seller-items', page],
        queryFn: () => sellerApi.getItems(page).then((r) => r.data.data),
        placeholderData: (prev) => prev,
    });
    const statusMutation = useMutation({
        mutationFn: ({ id, status }) => sellerApi.updateStatus(id, status),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['seller-items'] });
            setEditingId(null);
            toast.success('Статус обновлён'); // ← добавить
        },
        onError: () => {
            toast.error('Не удалось обновить статус'); // ← добавить
        },
    });
    const navigate = useNavigate();
    const totalPages = data ? Math.ceil(data.total / data.limit) : 1;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "\u041C\u043E\u0438 \u0442\u043E\u0432\u0430\u0440\u044B" }), _jsx(Link, { to: "/dashboard/seller/create", className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors", children: "+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C" })] }), isLoading ? (_jsx(LoadingSkeleton, {})) : data?.items.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16", children: [_jsx("p", { className: "text-sm text-gray-500", children: "\u041D\u0435\u0442 \u0442\u043E\u0432\u0430\u0440\u043E\u0432" }), _jsx(Link, { to: "/dashboard/seller/create", className: "mt-2 text-sm text-indigo-600 hover:underline", children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0435\u0440\u0432\u044B\u0439 \u0442\u043E\u0432\u0430\u0440" })] })) : (_jsx("div", { className: "space-y-3", children: data?.items.map((item) => (_jsx("div", { className: "rounded-xl border border-gray-200 bg-white p-5 shadow-sm", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-mono text-xs font-semibold text-indigo-600", children: item.trackingCode }), _jsx(StatusBadge, { status: item.currentStatus })] }), _jsx("p", { className: "mt-1 truncate text-sm font-medium text-gray-900", children: item.title }), _jsx("p", { className: "mt-0.5 text-xs text-gray-400", children: new Date(item.updatedAt).toLocaleString('ru-RU') })] }), _jsxs("div", { className: "flex flex-shrink-0 gap-2", children: [editingId === item.id ? (_jsx("select", { defaultValue: item.currentStatus, onChange: (e) => statusMutation.mutate({ id: item.id, status: e.target.value }), className: "rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200", children: STATUSES.map((s) => (_jsx("option", { value: s, children: s }, s))) })) : (_jsx("button", { onClick: () => setEditingId(item.id), className: "rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50", children: "\u0421\u0442\u0430\u0442\u0443\u0441" })), _jsx("button", { onClick: () => navigate(`/dashboard/seller/items/${item.id}`), className: "rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50", children: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435 \u2192" })] })] }) }, item.id))) })), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, className: "rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50", children: "\u2190" }), _jsxs("span", { className: "text-sm text-gray-600", children: [page, " / ", totalPages] }), _jsx("button", { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages, className: "rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50", children: "\u2192" })] }))] }));
}
