import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerApi, TrackedItemSummary } from '@/api/customer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { OrderHistoryDrawer } from './OrderHistoryDrawer';
import {useTranslation} from "react-i18next";


const STATUS_OPTIONS = [
    { value: '',           label: 'status.ALL' },
    { value: 'CREATED',    label: 'status.CREATED' },
    { value: 'PROCESSING', label: 'status.PROCESSING' },
    { value: 'SHIPPED',    label: 'status.SHIPPED' },
    { value: 'IN_TRANSIT', label: 'status.IN_TRANSIT' },
    { value: 'DELIVERED',  label: 'status.DELIVERED' },
    { value: 'CANCELLED',  label: 'status.CANCELLED' },
];


export function CustomerHistory() {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const {t} = useTranslation();

    const { data, isLoading } = useQuery({
        queryKey: ['customer-history', search, status],
        queryFn: () =>
            customerApi.getHistory({
                search: search || undefined,
                status: status || undefined,
            }).then((r) => r.data.data),
    });

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('orders.history')}</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {t('orders.subtitle')}
                    </p>
                </div>
                {data && (
                    <span className="text-sm text-gray-400">
                        {t('orders.orderNumbers', {code: data.total})}
                    </span>
                )}
            </div>

            {/* Поиск и фильтр */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <svg
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('orders.searchPlaceholder')}
                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                </div>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{t(opt.label)}</option>
                    ))}
                </select>
            </div>

            {/* Список */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
                    ))}
                </div>
            ) : data?.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
                    <div className="mb-3 text-4xl">📋</div>
                    <p className="text-sm font-medium text-gray-600">
                        {search || status ? t('common.notFound') : t('orders.historyEmpty')}
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="divide-y divide-gray-100">
                        {data?.items.map((item) => (
                            <HistoryRow
                                key={item.trackedItemId}
                                item={item}
                                onShowHistory={() => setSelectedItemId(item.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Drawer */}
            {selectedItemId && (
                <OrderHistoryDrawer
                    itemId={selectedItemId}
                    onClose={() => setSelectedItemId(null)}
                />
            )}
        </div>
    );
}

// ── Строка истории ────────────────────────────────────────────────────────────

function HistoryRow(
    {item, onShowHistory,}: {
    item: TrackedItemSummary;
    onShowHistory: () => void;
}
) {
    const {t} = useTranslation();
    return (
        <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-indigo-600">
                        {item.trackingCode}
                    </span>
                    <StatusBadge status={item.currentStatus} />
                </div>

                <p className="mt-0.5 truncate text-sm text-gray-700">{item.title}</p>

                {(item.fromCity || item.toCity) && (
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                        <span>{item.fromCity ?? '—'}</span>
                        <span>→</span>
                        <span>{item.toCity ?? '—'}</span>
                    </div>
                )}
            </div>

            <div className="flex flex-shrink-0 flex-col items-end gap-1">
                {item.cashOnDelivery !== undefined && item.cashOnDelivery > 0 && (
                    <span className="text-sm font-semibold text-gray-700">
                        {item.cashOnDelivery.toLocaleString('ru-RU')} ₸
                    </span>
                )}
                <span className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString('ru-RU', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                </span>
                <button
                    onClick={onShowHistory}
                    className="text-xs font-medium text-indigo-600 hover:underline"
                >
                    {t('orders.details')}
                </button>
            </div>
        </div>
    );
}