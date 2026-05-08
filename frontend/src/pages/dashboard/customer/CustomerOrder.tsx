import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customerApi, TrackedItemSummary } from '@/api/customer';
import { Status } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { OrderHistoryDrawer } from './OrderHistoryDrawer';
import toast from "react-hot-toast";
import {useSocket} from "@/hooks/useSocket";
import {useTranslation} from "react-i18next";

// ── Форма добавления трек-кода ────────────────────────────────────────────────

const AddTrackSchema = z.object({
    trackingCode: z
        .string()
        .min(6, 'Минимум 6 символов')
        .max(64)
        .regex(/^[A-Z0-9-]+$/, 'Только заглавные буквы, цифры и дефис')
        .transform((v) => v.toUpperCase()),
});

type AddTrackForm = z.infer<typeof AddTrackSchema>;

const { t } = useTranslation();

const STATUS_CONFIG: {
    value: Status;
    label: string;
    icon: string;
    color: string;
}[] = [
    { value: 'CREATED',    label: t('status.CREATED'),   icon: '🕐', color: 'text-gray-600' },
    { value: 'PROCESSING', label: t('status.PROCESSING'),     icon: '🏭', color: 'text-blue-600' },
    { value: 'SHIPPED',    label: t('status.SHIPPED'),     icon: '📦', color: 'text-yellow-600' },
    { value: 'IN_TRANSIT', label: t('status.IN_TRANSIT'),        icon: '🚚', color: 'text-orange-600' },
    { value: 'DELIVERED',  label: t('status.DELIVERED'),     icon: '✅', color: 'text-green-600' },
    { value: 'CANCELLED',  label: t('status.CANCELLED'),       icon: '❌', color: 'text-red-500' },
];

// ── Главная страница ──────────────────────────────────────────────────────────

export function CustomerOrders() {
    useSocket();

    const qc = useQueryClient();
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<Status | null>(null);

    // Статистика
    const { data: stats } = useQuery({
        queryKey: ['customer-stats'],
        queryFn: () => customerApi.getStats().then((r) => r.data.data),
    });

    // Список заказов
    const { data, isLoading } = useQuery({
        queryKey: ['customer-tracked'],
        queryFn: () => customerApi.getTracked().then((r) => r.data.data),
    });

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<AddTrackForm>({ resolver: zodResolver(AddTrackSchema) });

    const addMutation = useMutation({
        mutationFn: (code: string) => customerApi.addTracked(code),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['customer-tracked'] });
            void qc.invalidateQueries({ queryKey: ['customer-stats'] });
            reset();
            toast.success('Заказ добавлен в отслеживание');
        },
        onError: (err: unknown) => {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data
                    ?.message ?? 'Товар не найден';
            setError('trackingCode', { message: msg });
            toast.error(msg);
        },
    });

    const removeMutation = useMutation({
        mutationFn: (itemId: string) => customerApi.removeTracked(itemId),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['customer-tracked'] });
            void qc.invalidateQueries({ queryKey: ['customer-stats'] });
            toast.success('Заказ удалён из отслеживания');
        },
        onError: () => toast.error('Не удалось удалить заказ'),
    });

    const onAddSubmit = (values: AddTrackForm) =>
        addMutation.mutate(values.trackingCode);

    // Фильтрация по статусу
    const filteredItems = statusFilter
        ? data?.items.filter((item) => item.currentStatus === statusFilter)
        : data?.items;

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <h1 className="text-2xl font-bold text-gray-900">{t('orders.title')}</h1>

            {/* Финансовая статистика */}
            {stats && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-green-100 bg-green-50 p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wider text-green-600">
                            {t('orders.paid')}
                        </p>
                        <p className="mt-1 text-xl font-bold text-green-700">
                            {stats.totalPaid.toLocaleString('ru-RU')} ₸
                        </p>
                    </div>
                    <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wider text-orange-600">
                            {t('orders.toPay')}
                        </p>
                        <p className="mt-1 text-xl font-bold text-orange-700">
                            {stats.totalToPay.toLocaleString('ru-RU')} ₸
                        </p>
                    </div>
                </div>
            )}

            {/* Счётчики по статусам */}
            {stats && stats.total > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    {STATUS_CONFIG.map((s, idx) => {
                        const count = stats.statusCounts[s.value] ?? 0;
                        if (count === 0) return null;
                        const isActive = statusFilter === s.value;

                        return (
                            <button
                                key={s.value}
                                onClick={() => setStatusFilter(isActive ? null : s.value)}
                                className={[
                                    'flex w-full items-center justify-between px-5 py-3.5 transition-colors',
                                    idx > 0 ? 'border-t border-gray-100' : '',
                                    isActive ? 'bg-indigo-50' : 'hover:bg-gray-50',
                                ].join(' ')}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{s.icon}</span>
                                    <span className={`text-sm font-medium ${isActive ? 'text-indigo-700' : 'text-gray-700'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {count > 0 && (
                                        <span className={[
                                            'rounded-full px-2 py-0.5 text-xs font-semibold',
                                            isActive
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-600',
                                        ].join(' ')}>
                                            {count}
                                        </span>
                                    )}
                                    <span className="text-gray-400">›</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Активный фильтр */}
            {statusFilter && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                        Фильтр: {STATUS_CONFIG.find((s) => s.value === statusFilter)?.label}
                    </span>
                    <button
                        onClick={() => setStatusFilter(null)}
                        className="text-xs text-indigo-600 hover:underline"
                    >
                        Сбросить
                    </button>
                </div>
            )}

            {/* Форма добавления трек-кода */}
            <form
                onSubmit={handleSubmit(onAddSubmit)}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t('orders.addLabel')}
                </label>
                <div className="flex gap-3">
                    <div className="flex-1">
                        <input
                            {...register('trackingCode')}
                            placeholder="TRK-202406-XXXXXXXX"
                            autoComplete="off"
                            spellCheck={false}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 font-mono text-sm uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:font-sans placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        {errors.trackingCode && (
                            <p className="mt-1.5 text-xs text-red-600">
                                ⚠ {errors.trackingCode.message}
                            </p>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting || addMutation.isPending}
                        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                    >
                        {addMutation.isPending ? (
                            <span className="flex items-center gap-2">
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                {t('orders.searching')}
                            </span>
                        ) : (
                            t('orders.track')
                        )}
                    </button>
                </div>
            </form>

            {/* Список заказов */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 animate-pulse rounded-xl border border-gray-100 bg-gray-50" />
                    ))}
                </div>
            ) : filteredItems?.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
                    <div className="mb-3 text-4xl">📦</div>
                    <p className="text-sm font-medium text-gray-600">
                        {statusFilter ? t("orders.noOrdersStatus") : t('orders.noOrders')}
                    </p>
                    {!statusFilter && (
                        <p className="mt-1 text-xs text-gray-400">
                            {t('orders.noOrdersHint')}
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredItems?.map((item) => (
                        <OrderCard
                            key={item.trackedItemId}
                            item={item}
                            onShowHistory={() => setSelectedItemId(item.id)}
                            onRemove={() => removeMutation.mutate(item.id)}
                            isRemoving={
                                removeMutation.isPending && removeMutation.variables === item.id
                            }
                        />
                    ))}
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

// ── Вспомогательные компоненты ────────────────────────────────────────────────
interface OrderCardProps {
    item: TrackedItemSummary;
    onShowHistory: () => void;
    onRemove: () => void;
    isRemoving: boolean;
}

function OrderCard({ item, onShowHistory, onRemove, isRemoving }: OrderCardProps) {
    const timeline = [...item.statusHistory].reverse().slice(0, 4);

    return (
        <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">

                    {/* Трек-код и статус */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold tracking-wider text-indigo-600">
                          {item.trackingCode}
                        </span>
                        <StatusBadge status={item.currentStatus} />
                    </div>

                    {/* Название */}
                    <p className="mt-1 truncate text-sm font-medium text-gray-900">
                        {item.title}
                    </p>

                    {/* ← Города */}
                    {(item.fromCity || item.toCity) && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                            <span>📍</span>
                            <span>{item.fromCity ?? '—'}</span>
                            <span className="text-gray-300">→</span>
                            <span className="font-medium text-gray-700">{item.toCity ?? '—'}</span>
                        </div>
                    )}

                    {/* ← Дата и время отправки */}
                    <p className="mt-1 text-xs text-gray-400">
                        {t('orders.sentAt')}:{' '}
                        {item.createdAt
                            ? new Date(item.createdAt).toLocaleString('ru-RU', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })
                            : '—'}
                    </p>

                    {/* Мини-хронология */}
                    {timeline.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-1">
                            {timeline.map((step, i) => (
                                <React.Fragment key={i}>
                                    {i > 0 && <span className="text-xs text-gray-300">›</span>}
                                    <StatusChip status={step.newStatus} />
                                </React.Fragment>
                            ))}
                            {item.statusHistory.length > 4 && (
                                <span className="text-xs text-gray-400">
                                  +{item.statusHistory.length - 4} ещё
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Кнопки */}
                <div className="flex flex-shrink-0 flex-col gap-2">
                    <button
                        onClick={onShowHistory}
                        className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                    >
                        {t('orders.details')}
                    </button>
                    <button
                        onClick={onRemove}
                        disabled={isRemoving}
                        className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-100 disabled:opacity-40"
                    >
                        {isRemoving ? '...' : t('orders.remove')}
                    </button>
                </div>
            </div>
        </div>
    );
}

/** Мини-чип статуса для хронологии в карточке */
function StatusChip({ status }: { status: Status }) {
    const CHIP: Record<Status, string> = {
        CREATED:    'bg-gray-100 text-gray-500',
        PROCESSING: 'bg-blue-50 text-blue-600',
        SHIPPED:    'bg-yellow-50 text-yellow-600',
        IN_TRANSIT: 'bg-orange-50 text-orange-600',
        DELIVERED:  'bg-green-50 text-green-700',
        CANCELLED:  'bg-red-50 text-red-500',
    };
    const LABEL: Record<Status, string> = {
        CREATED:    'Создан',
        PROCESSING: 'Обработка',
        SHIPPED:    'Отправлен',
        IN_TRANSIT: 'В пути',
        DELIVERED:  'Доставлен',
        CANCELLED:  'Отменён',
    };
    return (
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${CHIP[status]}`}>
      {LABEL[status]}
    </span>
    );
}