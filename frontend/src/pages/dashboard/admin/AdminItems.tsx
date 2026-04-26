import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Status } from '@/types';
import toast from "react-hot-toast";

const STATUSES: Status[] = ['CREATED','PROCESSING','SHIPPED','IN_TRANSIT','DELIVERED','CANCELLED'];

export function AdminItems() {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-items', page, search],
        queryFn: () => adminApi.getItems(page, 20, search || undefined).then((r) => r.data.data),
        placeholderData: (prev) => prev,
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            adminApi.updateStatus(id, status),
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Все товары</h1>
                {data && (
                    <span className="text-sm text-gray-400">Итого: {data.total}</span>
                )}
            </div>

            <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Поиск по коду или названию..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />

            {isLoading ? (
                <LoadingSkeleton />
            ) : data?.items.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-sm text-gray-500">Ничего не найдено</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {data?.items.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-indigo-600">
                      {item.trackingCode}
                    </span>
                                        <StatusBadge status={item.currentStatus} />
                                    </div>
                                    <p className="mt-1 truncate text-sm font-medium text-gray-900">
                                        {item.title}
                                    </p>
                                    <p className="mt-0.5 text-xs text-gray-400">
                                        {new Date(item.updatedAt).toLocaleString('ru-RU')}
                                    </p>
                                </div>

                                <div className="flex-shrink-0">
                                    {editingId === item.id ? (
                                        <select
                                            defaultValue={item.currentStatus}
                                            onChange={(e) =>
                                                statusMutation.mutate({ id: item.id, status: e.target.value })
                                            }
                                            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none"
                                        >
                                            {STATUSES.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <button
                                            onClick={() => setEditingId(item.id)}
                                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                                        >
                                            Статус
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50">←</button>
                    <span className="text-sm text-gray-600">{page} / {totalPages}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50">→</button>
                </div>
            )}
        </div>
    );
}