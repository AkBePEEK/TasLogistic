import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';
import { useTranslation } from "react-i18next";

const PERIODS = [
    { value: 'today', label: 'reports.today' },
    { value: 'week',  label: 'reports.week' },
    { value: 'month', label: 'reports.month' },
    { value: 'year',  label: 'reports.year' },
];

const STATUS_LABELS: Record<string, string> = {
    CREATED:    'status.CREATED',
    PROCESSING: 'status.PROCESSING',
    SHIPPED:    'status.SHIPPED',
    IN_TRANSIT: 'status.IN_TRANSIT',
    DELIVERED:  'status.DELIVERED',
    CANCELLED:  'status.CANCELLED',
};

const STATUS_COLORS: Record<string, string> = {
    CREATED:    'bg-gray-100 text-gray-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    SHIPPED:    'bg-yellow-100 text-yellow-700',
    IN_TRANSIT: 'bg-orange-100 text-orange-700',
    DELIVERED:  'bg-green-100 text-green-700',
    CANCELLED:  'bg-red-100 text-red-700',
};

// Тип транспорта → иконка и цвет (для блока веса по транспорту)
const DELIVERY_TYPE_META: Record<'AVIA' | 'RAIL' | 'TRUCK', { icon: string; bar: string }> = {
    AVIA:  { icon: '✈️', bar: 'bg-sky-500' },
    RAIL:  { icon: '🚂', bar: 'bg-amber-500' },
    TRUCK: { icon: '🚛', bar: 'bg-indigo-500' },
};

export function AdminReports() {
    const [period, setPeriod] = useState('month');

    // Берем данные напрямую из готового отчета бэкенда
    const { data, isLoading } = useQuery({
        queryKey: ['admin-reports', period],
        queryFn: () => adminApi.getReports(period).then((r) => r.data.data),
    });

    const { t } = useTranslation();

    // Локальные безопасные переменные с фолбеками на случай, если данные еще грузятся или пусты
    const totalOrders = data?.total ?? 0;
    const totalAmount = data?.totalAmount ?? 0;
    const deliveredAmount = data?.deliveredAmount ?? 0;
    const pendingAmount = Math.max(0, totalAmount - deliveredAmount);

    const totalWeight = data?.totalWeight ?? 0;
    const deliveredWeight = data?.deliveredWeight ?? 0;
    Math.max(0, Math.round((totalWeight - deliveredWeight) * 100) / 100);
    const statusCounts = data?.statusCounts ?? {};
    const topCities = data?.topCities ?? [];

    // Вес по типам транспорта — с фолбеком на нули, чтобы все три типа всегда отображались
    const weightByDeliveryType = {
        AVIA: 0, RAIL: 0, TRUCK: 0,
        ...(data?.weightByDeliveryType ?? {}),
    };
    const maxDeliveryWeight = Math.max(...Object.values(weightByDeliveryType), 1);

    const weightByCityAndDeliveryType = data?.weightByCityAndDeliveryType ?? {};

    // Строим плоский список строк для таблицы: { city, deliveryType, weight }
    const cityTransportRows = Object.entries(weightByCityAndDeliveryType)
        .flatMap(([city, byType]) =>
            Object.entries(byType).map(([deliveryType, weight]) => ({
                city,
                deliveryType,
                weight,
            }))
        )
        .sort((a, b) => a.city.localeCompare(b.city) || a.deliveryType.localeCompare(b.deliveryType));

    return (
        <div className="space-y-6">
            {/* Заголовок + фильтр периода */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">
                    {t('nav.reports')}
                </h1>

                <div className="flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                    {PERIODS.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={[
                                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                                period === p.value
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-500 hover:text-gray-700',
                            ].join(' ')}
                        >
                            {t(p.label)}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
                    ))}
                </div>
            ) : data ? (
                <>
                    {/* Основные метрики */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <MetricCard
                            label={t('reports.totalOrders')}
                            value={totalOrders.toString()}
                            icon="📦"
                            color="indigo"
                        />
                        <MetricCard
                            label={t('reports.totalAmount')}
                            value={`${totalAmount.toLocaleString('ru-RU')} ₸`}
                            icon="💰"
                            color="green"
                        />
                        <MetricCard
                            label={t('reports.totalWeight')}
                            value={`${totalWeight} кг`}
                            icon="⚖️"
                            color="blue"
                        />

                        {/* Вместо карточки "Доставлено: количество" — вес по типам транспорта */}
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
                            <div className="flex items-start justify-between">
                                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {t('reports.weightByTransport')}
                                </p>
                                <span className="text-xl">🚚</span>
                            </div>
                            <div className="mt-2 space-y-1.5">
                                {(['AVIA', 'RAIL', 'TRUCK'] as const).map((dt) => (
                                    <div key={dt} className="flex items-center justify-between gap-2">
                                        <span className="flex items-center gap-1 text-xs text-gray-600">
                                            <span>{DELIVERY_TYPE_META[dt].icon}</span>
                                            {t(`carrierType.${dt}`)}
                                        </span>
                                        <span className="text-xs font-semibold text-emerald-700">
                                            {weightByDeliveryType[dt]} кг
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Финансовый итог vs Вес */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Сумма доставленных */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="mb-4 text-sm font-semibold text-gray-700">
                                {t('reports.financialSummary')}
                            </p>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t('reports.allOrdersAmount')}</span>
                                    <span className="font-semibold">{totalAmount.toLocaleString('ru-RU')} ₸</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t('reports.receivedDelivered')}</span>
                                    <span className="font-semibold text-green-600">{deliveredAmount.toLocaleString('ru-RU')} ₸</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t('reports.pending')}</span>
                                    <span className="font-semibold text-orange-600">{pendingAmount.toLocaleString('ru-RU')} ₸</span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-gray-100">
                                    <div
                                        className="h-2 rounded-full bg-green-500 transition-all"
                                        style={{ width: totalAmount > 0 ? `${Math.round((deliveredAmount / totalAmount) * 100)}%` : '0%' }}
                                    />
                                </div>
                                <p className="text-right text-xs text-gray-400">
                                    {totalAmount > 0 ? Math.round((deliveredAmount / totalAmount) * 100) : 0}% {t('reports.completed')}
                                </p>
                            </div>
                        </div>

                        {/* Вес по транспорту — подробная разбивка с прогресс-барами */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="mb-4 text-sm font-semibold text-gray-700">
                                {t('reports.weightByTransport')}
                            </p>
                            <div className="space-y-3">
                                {(['AVIA', 'RAIL', 'TRUCK'] as const).map((dt) => (
                                    <div key={dt} className="flex items-center gap-3">
                                        <span className="flex w-20 flex-shrink-0 items-center gap-1 text-sm text-gray-600">
                                            <span>{DELIVERY_TYPE_META[dt].icon}</span>
                                            {t(`carrierType.${dt}`)}
                                        </span>
                                        <div className="h-2 flex-1 rounded-full bg-gray-100">
                                            <div
                                                className={`h-2 rounded-full transition-all ${DELIVERY_TYPE_META[dt].bar}`}
                                                style={{ width: `${Math.round((weightByDeliveryType[dt] / maxDeliveryWeight) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="w-16 flex-shrink-0 text-right text-sm font-semibold text-gray-700">
                                            {weightByDeliveryType[dt]} кг
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 border-t border-gray-100 pt-3 flex justify-between text-xs text-gray-400">
                                <span>{t('common.total')}</span>
                                <span className="font-semibold text-gray-600">{totalWeight} кг</span>
                            </div>
                        </div>
                    </div>

                    {/* Статусы + топ городов */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* По статусам */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="mb-4 text-sm font-semibold text-gray-700">
                                {t('reports.byStatus')}
                            </p>
                            {Object.keys(statusCounts).length === 0 ? (
                                <p className="text-sm text-gray-400">{t('common.nothingFound')}</p>
                            ) : (
                                <div className="space-y-2">
                                    {Object.entries(statusCounts).map(([status, count]) => {
                                        const normalizedStatus = status.toUpperCase();
                                        return (
                                            <div key={status} className="flex items-center justify-between">
                                                <span className={[
                                                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                                                    STATUS_COLORS[normalizedStatus] ?? 'bg-gray-100 text-gray-600',
                                                ].join(' ')}>
                                                  {t(STATUS_LABELS[normalizedStatus] ?? status)}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-24 rounded-full bg-gray-100">
                                                        <div
                                                            className="h-2 rounded-full bg-indigo-400"
                                                            style={{ width: totalOrders > 0 ? `${Math.round(((count ?? 0) / totalOrders) * 100)}%` : '0%' }}
                                                        />
                                                    </div>
                                                    <span className="w-6 text-right text-sm font-semibold text-gray-700">
                                                        {count}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Вес по городам и видам транспорта */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="mb-4 text-sm font-semibold text-gray-700">
                                {t('reports.weightByCityAndTransport')}
                            </p>
                            {cityTransportRows.length === 0 ? (
                                <p className="text-sm text-gray-400">{t('common.nothingFound')}</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                                        <th className="py-2 pr-4 font-medium">{t('reports.city')}</th>
                                        <th className="py-2 pr-4 font-medium">{t('reports.transportType')}</th>
                                        <th className="py-2 text-right font-medium">{t('reports.totalWeight')}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {cityTransportRows.map((row, idx) => {
                                        const prevCity = cityTransportRows[idx - 1]?.city;
                                        const isNewCity = row.city !== prevCity;
                                        return (
                                            <tr key={`${row.city}-${row.deliveryType}`} className="border-b border-gray-50 last:border-0">
                                                <td className="py-2 pr-4 text-gray-700">
                                                    {isNewCity ? row.city : ''}
                                                </td>
                                                <td className="py-2 pr-4 text-gray-600">
                                                <span className="inline-flex items-center gap-1">
                                                    <span>{DELIVERY_TYPE_META[row.deliveryType as 'AVIA' | 'RAIL' | 'TRUCK']?.icon}</span>
                                                    {t(`carrierType.${row.deliveryType}`)}
                                                </span>
                                                </td>
                                                <td className="py-2 text-right font-semibold text-gray-700">
                                                    {row.weight} кг
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Топ городов */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="mb-4 text-sm font-semibold text-gray-700">
                                {t('reports.topCities')}
                            </p>
                            {topCities.length === 0 ? (
                                <p className="text-sm text-gray-400">{t('common.nothingFound')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {topCities.map(({ city, count }, idx) => (
                                        <div key={city} className="flex items-center gap-3">
                                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                                                {idx + 1}
                                            </span>
                                            <span className="flex-1 text-sm text-gray-700">{city}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-20 rounded-full bg-gray-100">
                                                    <div
                                                        className="h-2 rounded-full bg-indigo-500"
                                                        style={{ width: topCities[0] ? `${Math.round((count / topCities[0].count) * 100)}%` : '0%' }}
                                                    />
                                                </div>
                                                <span className="w-6 text-right text-sm font-semibold">
                                                    {count}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}

// ── Карточка метрики ──────────────────────────────────────────────────────────
function MetricCard({
                        label, value, icon, color, sub,
                    }: {
    label: string;
    value: string;
    icon: string;
    color: 'indigo' | 'green' | 'blue' | 'emerald';
    sub?: string;
}) {
    const colorMap = {
        indigo:  'border-indigo-100 bg-indigo-50',
        green:   'border-green-100 bg-green-50',
        blue:    'border-blue-100 bg-blue-50',
        emerald: 'border-emerald-100 bg-emerald-50',
    };
    const textMap = {
        indigo:  'text-indigo-700',
        green:   'text-green-700',
        blue:    'text-blue-700',
        emerald: 'text-emerald-700',
    };

    return (
        <div className={`rounded-xl border p-4 shadow-sm ${colorMap[color]}`}>
            <div className="flex items-start justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
                <span className="text-xl">{icon}</span>
            </div>
            <p className={`mt-2 text-xl font-bold ${textMap[color]}`}>{value}</p>
            {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
    );
}