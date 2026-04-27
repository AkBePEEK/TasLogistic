import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {Link, useNavigate} from 'react-router-dom';
import { sellerApi } from '@/api/seller';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Status } from '@/types';
import toast from "react-hot-toast";

const STATUSES: Status[] = ['CREATED','PROCESSING','SHIPPED','IN_TRANSIT','DELIVERED','CANCELLED'];

export function SellerItems() {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [editingId, setEditingId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['seller-items', page],
        queryFn: () => sellerApi.getItems(page).then((r) => r.data.data),
        placeholderData: (prev) => prev,
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            sellerApi.updateStatus(id, status),
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Мои товары</h1>
                <Link
                    to="/dashboard/seller/create"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                    + Добавить
                </Link>
            </div>

            {data && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                            Всего отправок
                        </p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{data.total}</p>
                    </div>
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wider text-indigo-500">
                            За этот месяц
                        </p>
                        <p className="mt-1 text-2xl font-bold text-indigo-700">{data.monthlyCount}</p>
                    </div>
                </div>
            )}

            {isLoading ? (
                <LoadingSkeleton />
            ) : data?.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
                    <p className="text-sm text-gray-500">Нет товаров</p>
                    <Link to="/dashboard/seller/create" className="mt-2 text-sm text-indigo-600 hover:underline">
                        Добавить первый товар
                    </Link>
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

                                <div className="flex flex-shrink-0 gap-2">
                                    {editingId === item.id ? (
                                        <select
                                            defaultValue={item.currentStatus}
                                            onChange={(e) =>
                                                statusMutation.mutate({ id: item.id, status: e.target.value })
                                            }
                                            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200"
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
                                    <button
                                        onClick={() => navigate(`/dashboard/seller/items/${item.id}`)}
                                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                                    >
                                        Подробнее →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
                    >
                        ←
                    </button>
                    <span className="text-sm text-gray-600">{page} / {totalPages}</span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    );
}