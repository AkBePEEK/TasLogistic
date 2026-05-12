import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {Link, useNavigate} from 'react-router-dom';
import { sellerApi } from '@/api/seller';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Status } from '@/types';
import toast from "react-hot-toast";
import {useSocket} from "@/hooks/useSocket";
import {useTranslation} from "react-i18next";
import {formatDate} from "../../../../../backend/src/utils/formatDate";


const STATUSES: { value: Status; label: string }[] = [
    { value: 'CREATED',    label: 'status.CREATED' },
    { value: 'PROCESSING', label: 'status.PROCESSING' },
    { value: 'SHIPPED',    label: 'status.SHIPPED' },
    { value: 'IN_TRANSIT', label: 'status.IN_TRANSIT' },
    { value: 'DELIVERED',  label: 'status.DELIVERED' },
    { value: 'CANCELLED',  label: 'status.CANCELLED' },
];

interface EditingState {
    id: string;
    status: Status;
    location: string;
}

export function SellerItems() {
    useSocket();

    const qc = useQueryClient();
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [editing, setEditing] = useState<EditingState | null>(null);
    const { i18n, t } = useTranslation();

    const { data, isLoading } = useQuery({
        queryKey: ['seller-items', page],
        queryFn: () => sellerApi.getItems(page).then((r) => r.data.data),
        placeholderData: (prev) => prev,
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status, location }: { id: string; status: string; location?: string }) =>
            sellerApi.updateStatus(id, status, location),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['seller-items'] });
            setEditing(null);
            toast.success('Статус обновлён');
        },
        onError: () => toast.error('Не удалось обновить статус'),
    });

    const totalPages = data ? Math.ceil(data.total / 20) : 1;

    return (
        <div className="space-y-6">
            {/* Заголовок + статистика */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">{t('nav.myItems')}</h1>
                <Link
                    to="/dashboard/seller/create"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                    + {t('nav.add')}
                </Link>
            </div>

            {/* Статистика за месяц */}
            {data && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                            {t('common.totalItems')}
                        </p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{data.total}</p>
                    </div>
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wider text-indigo-500">
                            {t('common.thisMonth')}
                        </p>
                        <p className="mt-1 text-2xl font-bold text-indigo-700">
                            {data.monthlyCount}
                        </p>
                    </div>
                </div>
            )}

            {/* Список */}
            {isLoading ? (
                <LoadingSkeleton />
            ) : data?.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
                    <p className="text-sm text-gray-500">{t('common.noItems')}</p>
                    <Link
                        to="/dashboard/seller/create"
                        className="mt-2 text-sm text-indigo-600 hover:underline"
                    >
                        {t('common.addFirst')}
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
                                <div className="min-w-0 flex-1">
                                    {/* Трек-код и статус */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-xs font-semibold text-indigo-600">
                                          {item.trackingCode}
                                        </span>
                                        <StatusBadge status={item.currentStatus} />
                                    </div>

                                    {/* Название */}
                                    <p className="mt-1 truncate text-sm font-medium text-gray-900">
                                        {item.title}
                                    </p>

                                    {/* Дата */}
                                    <p className="mt-0.5 text-xs text-gray-400">
                                        {formatDate(item.updatedAt, i18n.language)}
                                    </p>

                                    {/* Форма смены статуса */}
                                    {editing?.id === item.id && (
                                        <div className="mt-3 space-y-2 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                                    {t('common.newStatus')}
                                                </label>
                                                <select
                                                    value={editing.status}
                                                    onChange={(e) =>
                                                        setEditing((prev) =>
                                                            prev ? { ...prev, status: e.target.value as Status } : null
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                                >
                                                    {STATUSES.map((s) => (
                                                        <option key={s.value} value={s.value}>{t(s.label)}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* ← Поле города */}
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                                    {t('common.location')}
                                                </label>
                                                <input
                                                    value={editing.location}
                                                    onChange={(e) =>
                                                        setEditing((prev) =>
                                                            prev ? { ...prev, location: e.target.value } : null
                                                        )
                                                    }
                                                    placeholder={t('common.locationHint')}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                                />
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        statusMutation.mutate({
                                                            id: item.id,
                                                            status: editing.status,
                                                            location: editing.location || undefined,
                                                        })
                                                    }
                                                    disabled={statusMutation.isPending}
                                                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                                >
                                                    {statusMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                                                </button>
                                                <button
                                                    onClick={() => setEditing(null)}
                                                    className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                                                >
                                                    {t('common.cancel')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Кнопки действий */}
                                {editing?.id !== item.id && (
                                    <div className="flex flex-shrink-0 flex-col gap-2">

                                        <button
                                            onClick={() =>
                                                setEditing({
                                                    id: item.id,
                                                    status: item.currentStatus,
                                                    location: '',
                                                })
                                            }
                                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                                        >
                                            {t('common.statusBtn')}
                                        </button>

                                        <button
                                            onClick={() => navigate(`/dashboard/seller/items/${item.id}`)}
                                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                                        >
                                            {t('orders.details')}
                                        </button>

                                        <button
                                            onClick={() => navigate(`/dashboard/seller/items/${item.id}/receipt`)}
                                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
                                        >
                                            {t('common.receipt')}
                                        </button>

                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Пагинация */}
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