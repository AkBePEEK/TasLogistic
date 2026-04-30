import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';

const PERIODS = [
    { value: 'today', label: 'Сегодня' },
    { value: 'week',  label: 'Неделя' },
    { value: 'month', label: 'Месяц' },
    { value: 'year',  label: 'Год' },
];

const STATUS_LABELS: Record<string, string> = {
    CREATED:    'Создан',
    PROCESSING: 'Обработка',
    SHIPPED:    'Отправлен',
    IN_TRANSIT: 'В пути',
    DELIVERED:  'Доставлен',
    CANCELLED:  'Отменён',
};

const STATUS_COLORS: Record<string, string> = {
    CREATED:    'bg-gray-100 text-gray-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    SHIPPED:    'bg-yellow-100 text-yellow-700',
    IN_TRANSIT: 'bg-orange-100 text-orange-700',
    DELIVERED:  'bg-green-100 text-green-700',
    CANCELLED:  'bg-red-100 text-red-700',
};

export function AdminReports() {
    const [period, setPeriod] = useState('month');

    const { data, isLoading } = useQuery({
        queryKey: ['admin-reports', period],
        queryFn: () => adminApi.getReports(period).then((r) => r.data.data),
    });

    return (
        <div className="space-y-6">
            {/* Заголовок + фильтр периода */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Отчёты</h1>

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
                            {p.label}
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
                            label="Всего заказов"
                            value={data.total.toString()}
                            icon="📦"
                            color="indigo"
                        />
                        <MetricCard
                            label="Общая сумма"
                            value={`${data.totalAmount.toLocaleString('ru-RU')} ₸`}
                            icon="💰"
                            color="green"
                        />
                        <MetricCard
                            label="Общий вес"
                            value={`${data.totalWeight} кг`}
                            icon="⚖️"
                            color="blue"
                        />
                        <MetricCard
                            label="Доставлено"
                            value={`${data.statusCounts['DELIVERED'] ?? 0}`}
                            icon="✅"
                            color="emerald"
                            sub={`${data.deliveredAmount.toLocaleString('ru-RU')} ₸`}
                        />
                    </div>

                    {/* Доставленные vs Общее */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Сумма доставленных */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="mb-4 text-sm font-semibold text-gray-700">
                                Финансовый итог
                            </p>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Сумма всех заказов</span>
                                    <span className="font-semibold">
                    {data.totalAmount.toLocaleString('ru-RU')} ₸
                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Получено (доставлено)</span>
                                    <span className="font-semibold text-green-600">
                    {data.deliveredAmount.toLocaleString('ru-RU')} ₸
                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Ожидается</span>
                                    <span className="font-semibold text-orange-600">
                    {(data.totalAmount - data.deliveredAmount).toLocaleString('ru-RU')} ₸
                  </span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-gray-100">
                                    <div
                                        className="h-2 rounded-full bg-green-500 transition-all"
                                        style={{
                                            width: data.totalAmount > 0
                                                ? `${Math.round((data.deliveredAmount / data.totalAmount) * 100)}%`
                                                : '0%',
                                        }}
                                    />
                                </div>
                                <p className="text-right text-xs text-gray-400">
                                    {data.totalAmount > 0
                                        ? Math.round((data.deliveredAmount / data.totalAmount) * 100)
                                        : 0}% выполнено
                                </p>
                            </div>
                        </div>

                        {/* Вес */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="mb-4 text-sm font-semibold text-gray-700">
                                Статистика по весу
                            </p>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Общий вес заказов</span>
                                    <span className="font-semibold">{data.totalWeight} кг</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Доставлено</span>
                                    <span className="font-semibold text-green-600">
                    {data.deliveredWeight} кг
                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">В обработке</span>
                                    <span className="font-semibold text-orange-600">
                    {Math.round((data.totalWeight - data.deliveredWeight) * 100) / 100} кг
                  </span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-gray-100">
                                    <div
                                        className="h-2 rounded-full bg-blue-500 transition-all"
                                        style={{
                                            width: data.totalWeight > 0
                                                ? `${Math.round((data.deliveredWeight / data.totalWeight) * 100)}%`
                                                : '0%',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Статусы + топ городов */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* По статусам */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="mb-4 text-sm font-semibold text-gray-700">
                                По статусам
                            </p>
                            <div className="space-y-2">
                                {Object.entries(data.statusCounts).map(([status, count]) => (
                                    <div key={status} className="flex items-center justify-between">
                    <span className={[
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600',
                    ].join(' ')}>
                      {STATUS_LABELS[status] ?? status}
                    </span>
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-24 rounded-full bg-gray-100">
                                                <div
                                                    className="h-2 rounded-full bg-indigo-400"
                                                    style={{
                                                        width: data.total > 0
                                                            ? `${Math.round(((count ?? 0) / data.total) * 100)}%`
                                                            : '0%',
                                                    }}
                                                />
                                            </div>
                                            <span className="w-6 text-right text-sm font-semibold text-gray-700">
                        {count}
                      </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Топ городов */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="mb-4 text-sm font-semibold text-gray-700">
                                Топ городов назначения
                            </p>
                            {data.topCities.length === 0 ? (
                                <p className="text-sm text-gray-400">Нет данных</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.topCities.map(({ city, count }, idx) => (
                                        <div key={city} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                        {idx + 1}
                      </span>
                                            <span className="flex-1 text-sm text-gray-700">{city}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-20 rounded-full bg-gray-100">
                                                    <div
                                                        className="h-2 rounded-full bg-indigo-500"
                                                        style={{
                                                            width: data.topCities[0]
                                                                ? `${Math.round((count / data.topCities[0].count) * 100)}%`
                                                                : '0%',
                                                        }}
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
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    {label}
                </p>
                <span className="text-xl">{icon}</span>
            </div>
            <p className={`mt-2 text-xl font-bold ${textMap[color]}`}>{value}</p>
            {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
    );
}