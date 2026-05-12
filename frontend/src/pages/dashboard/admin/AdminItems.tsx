import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi, AdminItem } from '@/api/admin';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import {useSocket} from "@/hooks/useSocket";
import {useTranslation} from "react-i18next";
import {formatDateOnly} from "../../../../../backend/src/utils/formatDate";

const CITIES = [
    'Алматы', 'Астана', 'Шымкент', 'Қарағанды', 'Ақтобе',
    'Тараз', 'Павлодар', 'Өскемен', 'Семей', 'Атырау',
    'Қостанай', 'Орал', 'Петропавл', 'Түркістан', 'Көкшетау',
];


const STATUS_OPTIONS = [
    { value: '',           label: 'status.ALL' },
    { value: 'CREATED',    label: 'status.CREATED' },
    { value: 'PROCESSING', label: 'status.PROCESSING' },
    { value: 'SHIPPED',    label: 'status.SHIPPED' },
    { value: 'IN_TRANSIT', label: 'status.IN_TRANSIT' },
    { value: 'DELIVERED',  label: 'status.DELIVERED' },
    { value: 'CANCELLED',  label: 'status.CANCELLED' },
];

export function AdminItems() {
    useSocket();

    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const { t } = useTranslation();

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [fromCity, setFromCity] = useState('');
    const [toCity, setToCity] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const hasActiveFilters = status || fromCity || toCity || dateFrom || dateTo;

    const resetFilters = () => {
        setStatus('');
        setFromCity('');
        setToCity('');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    const { data, isLoading } = useQuery({
        queryKey: ['admin-items', page, search, status, fromCity, toCity, dateFrom, dateTo],
        queryFn: () =>
            adminApi.getItems({
                page, limit: 20,
                search: search || undefined,
                status: status || undefined,
                fromCity: fromCity || undefined,
                toCity: toCity || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
            }).then((r) => r.data.data),
        placeholderData: (prev) => prev,
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            adminApi.updateStatus(id, status),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['admin-items'] });
            setEditingId(null);
            toast.success(t('toast.statusUpdated'));
        },
        onError: () => toast.error(t('toast.statusUpdateError')),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminApi.deleteItem(id),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['admin-items'] });
            toast.success(t('toast.itemDeleted'));
        },
        onError: () => toast.error(t('toast.itemDeleteError')),
    });

    const totalPages = data ? Math.ceil(data.total / 20) : 1;

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">
                    {t("common.allOrders") + ' '}
                    {data && (
                        <span className="text-lg font-normal text-gray-400">({data.total})</span>
                    )}
                </h1>
                <button
                    onClick={() => setShowFilters((v) => !v)}
                    className={[
                        'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                        hasActiveFilters
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
                    ].join(' ')}
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                    </svg>
                    {t("common.filters")}
                    {hasActiveFilters && (
                        <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-xs text-white">
              !
            </span>
                    )}
                </button>
            </div>

            {/* Поиск */}
            <div className="relative">
                <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder={t('common.searchPlaceholder')}
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
            </div>

            {/* Панель фильтров */}
            {showFilters && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Статус */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                {t('common.statusBtn')}
                            </label>
                            <select
                                value={status}
                                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            >
                                {STATUS_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{t(o.label)}</option>
                                ))}
                            </select>
                        </div>

                        {/* Город отправки */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                {t('common.from')}
                            </label>
                            <select
                                value={fromCity}
                                onChange={(e) => { setFromCity(e.target.value); setPage(1); }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            >
                                <option value="">{t("common.allCities")}</option>
                                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Город доставки */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                {t('common.to')}
                            </label>
                            <select
                                value={toCity}
                                onChange={(e) => { setToCity(e.target.value); setPage(1); }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            >
                                <option value="">{t("common.allCities")}</option>
                                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Дата от */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                {t('common.dateFromLabel')}
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>

                        {/* Дата до */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                {t('common.dateToLabel')}
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="text-sm font-medium text-red-500 hover:text-red-700"
                        >
                            {t('common.resetAll')}
                        </button>
                    )}
                </div>
            )}

            {/* Таблица */}
            {isLoading ? (
                <LoadingSkeleton rows={5} />
            ) : data?.items.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-sm text-gray-500">{t('common.nothingFound')}</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="hidden grid-cols-[1.2fr_1fr_1fr_1.2fr_1fr_0.8fr_0.8fr_1fr] items-center gap-4 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 lg:grid">
                        <span>{t('common.trackCode')}</span>
                        <span>{t('common.recipient')}</span>
                        <span>{t('common.supplier')}</span>
                        <span>{t('common.route')}</span>
                        <span>{t('common.status')}</span>
                        <span>{t('common.amount')}</span>
                        <span>{t('common.date')}</span>
                        <span>{t('common.actions')}</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {data?.items.map((item) => (
                            <AdminRow
                                key={item.id}
                                item={item}
                                isEditing={editingId === item.id}
                                onEdit={() => setEditingId(item.id)}
                                onCancelEdit={() => setEditingId(null)}
                                onStatusChange={(status) =>
                                    statusMutation.mutate({ id: item.id, status })
                                }
                                onDelete={() => {
                                    if (confirm(`Удалить заказ ${item.trackingCode}?`)) {
                                        deleteMutation.mutate(item.id);
                                    }
                                }}
                                isPending={statusMutation.isPending}
                                isDeleting={
                                    deleteMutation.isPending && deleteMutation.variables === item.id
                                }
                            />
                        ))}
                    </div>
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

// ── Строка таблицы ────────────────────────────────────────────────────────────

interface AdminRowProps {
    item: AdminItem;
    isEditing: boolean;
    onEdit: () => void;
    onCancelEdit: () => void;
    onStatusChange: (status: string) => void;
    onDelete: () => void;
    isPending: boolean;
    isDeleting: boolean;
}

function AdminRow({item, isEditing, onEdit, onCancelEdit, onStatusChange, onDelete,isPending, isDeleting,}: AdminRowProps) {
    const { i18n, t } = useTranslation();
    return (
        <div className="px-5 py-4">
            {/* Desktop layout */}
            <div className="hidden grid-cols-[1.5fr_1.5fr_1.5fr_2fr_1fr_1fr_1fr_1.5fr] items-center gap-4 lg:grid">
                {/* Трек-код */}
                <span className="font-mono text-sm font-semibold text-indigo-600">
                    {item.trackingCode}
                </span>

                {/* Получатель */}
                <span className="truncate text-sm text-gray-700">
                    {item.recipientName ?? '—'}
                </span>

                {/* Продавец */}
                <span className="truncate text-xs text-gray-400">
                    {item.seller.email}
                </span>

                {/* Маршрут */}
                <div className="flex items-center gap-1 text-sm text-gray-500">
                    <span>{item.fromCity ?? '—'}</span>
                    <span className="text-gray-300">→</span>
                    <span className="font-medium text-gray-700">{item.toCity ?? '—'}</span>
                </div>

                {/* Статус */}
                <div>
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <select
                                defaultValue={item.currentStatus}
                                onChange={(e) => onStatusChange(e.target.value)}
                                disabled={isPending}
                                className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s.value} value={s.value}>{t(s.label)}</option>
                                ))}
                            </select>
                            <button onClick={onCancelEdit} className="text-xs text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                    ) : (
                        <StatusBadge status={item.currentStatus} />
                    )}
                </div>

                {/* Сумма */}
                <span className="text-sm font-medium text-gray-700">
                  {item.cashOnDelivery
                      ? `${item.cashOnDelivery.toLocaleString('ru-RU')} ₸`
                      : '—'}
                </span>

                {/* 7. Дата — отдельная ячейка */}
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatDateOnly(item.createdAt, i18n.language)}
                </span>

                {/* 8. Действия — отдельная ячейка, справа */}
                <div className="flex justify-end gap-3">
                    {!isEditing ? (
                        <>
                            <button onClick={onEdit} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                                {t('common.edit')}
                            </button>
                            <button onClick={onDelete} disabled={isDeleting} className="text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-40">
                                {isDeleting ? '...' : t('common.delete')}
                            </button>
                        </>
                    ) : (
                        <button onClick={onCancelEdit} className="text-sm font-medium text-gray-500 hover:text-gray-700">
                            {t('common.cancel')}
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile layout — карточка */}
            <div className="space-y-2 lg:hidden">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-indigo-600">
                    {item.trackingCode}
                  </span>
                    <StatusBadge status={item.currentStatus} />
                </div>

                {item.recipientName && (
                    <p className="text-sm text-gray-700">{item.recipientName}</p>
                )}

                {(item.fromCity || item.toCity) && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>{item.fromCity ?? '—'}</span>
                        <span>→</span>
                        <span className="font-medium text-gray-700">{item.toCity ?? '—'}</span>
                    </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString(i18n.language === 'kz' ? 'kk-KZ' : 'ru-RU')}
                  </span>
                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="text-sm font-medium text-red-500 disabled:opacity-40"
                    >
                        {isDeleting ? '...' : t('common.delete')}
                    </button>
                    <button
                        onClick={isEditing ? onCancelEdit : onEdit}
                        className="text-sm font-medium text-indigo-600"
                    >
                        {isEditing ? t('common.cancel') : t('common.edit')}
                    </button>
                </div>

                {isEditing && (
                    <select
                        defaultValue={item.currentStatus}
                        onChange={(e) => onStatusChange(e.target.value)}
                        disabled={isPending}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{t(s.label)}</option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
}