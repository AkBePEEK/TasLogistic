import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { sellerApi } from '@/api/seller';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Status } from '@/types';

const STATUSES: Status[] = [
    'CREATED',
    'PROCESSING',
    'SHIPPED',
    'IN_TRANSIT',
    'DELIVERED',
    'CANCELLED',
];

const STATUS_DOT: Record<Status, string> = {
    CREATED:    'bg-gray-400',
    PROCESSING: 'bg-blue-500',
    SHIPPED:    'bg-yellow-500',
    IN_TRANSIT: 'bg-orange-500',
    DELIVERED:  'bg-green-500',
    CANCELLED:  'bg-red-400',
};

export function ItemDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [editingStatus, setEditingStatus] = useState(false);

    const { data: item, isLoading, isError } = useQuery({
        queryKey: ['seller-item', id],
        queryFn: () => sellerApi.getItemById(id!).then((r) => r.data.data),
        enabled: !!id,
    });

    const statusMutation = useMutation({
        mutationFn: (status: string) => sellerApi.updateStatus(id!, status),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['seller-item', id] });
            void qc.invalidateQueries({ queryKey: ['seller-items'] });
            setEditingStatus(false);
            toast.success('Статус обновлён');
        },
        onError: () => toast.error('Не удалось обновить статус'),
    });

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    if (isError || !item) {
        return (
            <div className="rounded-xl bg-red-50 p-6 text-center">
                <p className="text-sm text-red-700">Товар не найден</p>
                <Link to="/dashboard/seller/items" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
                    ← Назад к списку
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Шапка */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard/seller/items')}
                        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ← Назад
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 truncate">{item.title}</h1>
                </div>

                {/* ← Добавить кнопку чека */}
                <button
                    onClick={() => navigate(`/dashboard/seller/items/${item.id}/receipt`)}
                    className="flex-shrink-0 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
                >
                    🖨 Печать чека
                </button>
            </div>

            {/* Основная информация */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                                Трек-код
                            </p>
                            <p className="mt-1 font-mono text-lg font-bold text-indigo-600">
                                {item.trackingCode}
                            </p>
                        </div>

                        {item.description && (
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                                    Описание
                                </p>
                                <p className="mt-1 text-sm text-gray-700">{item.description}</p>
                            </div>
                        )}

                        <div className="flex gap-6 text-xs text-gray-400">
                            <span>Создан: {new Date(item.createdAt).toLocaleDateString('ru-RU')}</span>
                            <span>Обновлён: {new Date(item.updatedAt).toLocaleString('ru-RU')}</span>
                        </div>
                    </div>

                    {/* Статус + смена */}
                    <div className="flex flex-col items-end gap-3">
                        <StatusBadge status={item.currentStatus} large />

                        {editingStatus ? (
                            <div className="flex items-center gap-2">
                                <select
                                    defaultValue={item.currentStatus}
                                    onChange={(e) => statusMutation.mutate(e.target.value)}
                                    disabled={statusMutation.isPending}
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                >
                                    {STATUSES.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setEditingStatus(false)}
                                    className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                    Отмена
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setEditingStatus(true)}
                                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                            >
                                Сменить статус
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* История статусов */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-gray-400">
                    История изменений — {item.statusHistory.length} событий
                </h2>

                {item.statusHistory.length === 0 ? (
                    <p className="text-sm text-gray-400">История пуста</p>
                ) : (
                    <ol className="relative ml-2 border-l-2 border-gray-100">
                        {item.statusHistory.map((entry, idx) => {
                            const isLast = idx === item.statusHistory.length - 1;
                            return (
                                <li key={entry.id} className={`relative ml-5 ${isLast ? 'pb-0' : 'pb-5'}`}>
                                    <span
                                          className={[
                                              'absolute -left-[25px] top-1 flex h-4 w-4 rounded-full ring-2 ring-white',
                                              STATUS_DOT[entry.newStatus],
                                          ].join(' ')}
                                    />
                                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                {idx > 0 && (
                                                    <span className="text-xs text-gray-400">
                                                        {entry.oldStatus} →
                                                    </span>
                                                )}
                                                <StatusBadge status={entry.newStatus} />
                                            </div>
                                            <time className="text-xs tabular-nums text-gray-400">
                                                {new Date(entry.changedAt).toLocaleString('ru-RU', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </time>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </div>
        </div>
    );
}