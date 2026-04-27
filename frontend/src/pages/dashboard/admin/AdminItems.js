import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import toast from "react-hot-toast";
const STATUSES = ['CREATED', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
export function AdminItems() {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState(null);
    const { data, isLoading } = useQuery({
        queryKey: ['admin-items', page, search],
        queryFn: () => adminApi.getItems(page, 20, search || undefined).then((r) => r.data.data),
        placeholderData: (prev) => prev,
    });
    const statusMutation = useMutation({
        mutationFn: ({ id, status }) => adminApi.updateStatus(id, status),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['admin-items'] });
            setEditingId(null);
            toast.success('Статус обновлён'); // ← добавить
        },
        onError: () => {
            toast.error('Не удалось обновить статус'); // ← добавить
        },
    });
    const totalPages = data ? Math.ceil(data.total / data.limit) : 1;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "\u0412\u0441\u0435 \u0442\u043E\u0432\u0430\u0440\u044B" }), data && (_jsxs("span", { className: "text-sm text-gray-400", children: ["\u0418\u0442\u043E\u0433\u043E: ", data.total] }))] }), _jsx("input", { value: search, onChange: (e) => { setSearch(e.target.value); setPage(1); }, placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043A\u043E\u0434\u0443 \u0438\u043B\u0438 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E...", className: "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" }), isLoading ? (_jsx(LoadingSkeleton, {})) : data?.items.length === 0 ? (_jsx("div", { className: "flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-200", children: _jsx("p", { className: "text-sm text-gray-500", children: "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E" }) })) : (_jsx("div", { className: "space-y-3", children: data?.items.map((item) => (_jsx("div", { className: "rounded-xl border border-gray-200 bg-white p-5 shadow-sm", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-mono text-xs font-semibold text-indigo-600", children: item.trackingCode }), _jsx(StatusBadge, { status: item.currentStatus })] }), _jsx("p", { className: "mt-1 truncate text-sm font-medium text-gray-900", children: item.title }), _jsx("p", { className: "mt-0.5 text-xs text-gray-400", children: new Date(item.updatedAt).toLocaleString('ru-RU') })] }), _jsx("div", { className: "flex-shrink-0", children: editingId === item.id ? (_jsx("select", { defaultValue: item.currentStatus, onChange: (e) => statusMutation.mutate({ id: item.id, status: e.target.value }), className: "rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none", children: STATUSES.map((s) => (_jsx("option", { value: s, children: s }, s))) })) : (_jsx("button", { onClick: () => setEditingId(item.id), className: "rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50", children: "\u0421\u0442\u0430\u0442\u0443\u0441" })) })] }) }, item.id))) })), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, className: "rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50", children: "\u2190" }), _jsxs("span", { className: "text-sm text-gray-600", children: [page, " / ", totalPages] }), _jsx("button", { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages, className: "rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50", children: "\u2192" })] }))] }));
}
