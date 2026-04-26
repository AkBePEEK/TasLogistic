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

// ── Главная страница ──────────────────────────────────────────────────────────

export function CustomerOrders() {
    const qc = useQueryClient();
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    // Загружаем полный список — без пагинации
    const { data, isLoading } = useQuery({
        queryKey: ['customer-tracked'],
        queryFn: () => customerApi.getTracked().then((r) => r.data.data),
    });

    // Форма добавления трек-кода
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
            reset();
            toast.success('Заказ добавлен в отслеживание'); // ← добавить
        },
        onError: (err: unknown) => {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data
                    ?.message ?? 'Товар не найден';
            setError('trackingCode', { message: msg });
            toast.error(msg); // ← добавить
        },
    });

    const removeMutation = useMutation({
        mutationFn: (itemId: string) => customerApi.removeTracked(itemId),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['customer-tracked'] });
            toast.success('Заказ удалён из отслеживания'); // ← добавить
        },
        onError: () => {
            toast.error('Не удалось удалить заказ'); // ← добавить
        },
    });

    const onAddSubmit = (values: AddTrackForm) =>
        addMutation.mutate(values.trackingCode);

    return (
        <div className="space-y-8">
            {/* ── Заголовок ────────────────────────────────────────── */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Мои заказы</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Вся история ваших отслеживаемых товаров
                    </p>
                </div>
                {data && (
                    <span className="text-sm text-gray-400">
            {data.total} {pluralize(data.total, 'заказ', 'заказа', 'заказов')}
          </span>
                )}
            </div>

            {/* ── Форма добавления ─────────────────────────────────── */}
            <form
                onSubmit={handleSubmit(onAddSubmit)}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Добавить заказ по трек-коду
                </label>
                <div className="flex gap-3">
                    <div className="flex-1">
                        <input
                            {...register('trackingCode')}
                            placeholder="TRK-123456"
                            autoComplete="off"
                            spellCheck={false}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 font-mono text-sm uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:font-sans placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        {errors.trackingCode && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                                <span>⚠</span> {errors.trackingCode.message}
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
                Поиск...
              </span>
                        ) : (
                            'Отслеживать'
                        )}
                    </button>
                </div>
            </form>

            {/* ── Список заказов ───────────────────────────────────── */}
            {isLoading ? (
                <LoadingState />
            ) : data?.items.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-3">
                    {data?.items.map((item) => (
                        <OrderCard
                            key={item.trackedItemId}
                            item={item}
                            onShowHistory={() => setSelectedItemId(item.id)}
                            onRemove={() => removeMutation.mutate(item.id)}
                            isRemoving={removeMutation.isPending && removeMutation.variables === item.id}
                        />
                    ))}
                </div>
            )}

            {/* ── Drawer с полной историей ─────────────────────────── */}
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

function LoadingState() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="h-24 animate-pulse rounded-xl border border-gray-100 bg-gray-50"
                />
            ))}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
            <div className="mb-3 text-4xl">📦</div>
            <p className="text-sm font-medium text-gray-600">Нет отслеживаемых заказов</p>
            <p className="mt-1 text-xs text-gray-400">
                Введите трек-код выше, чтобы начать отслеживать заказ
            </p>
        </div>
    );
}

interface OrderCardProps {
    item: TrackedItemSummary;
    onShowHistory: () => void;
    onRemove: () => void;
    isRemoving: boolean;
}

function OrderCard({ item, onShowHistory, onRemove, isRemoving }: OrderCardProps) {
    // Хронология для превью — от старых к новым, максимум 4 шага
    const timeline = [...item.statusHistory].reverse().slice(0, 4);

    return (
        <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                {/* Левая часть — информация */}
                <div className="min-w-0 flex-1">
                    {/* Строка с кодом и статусом */}
                    <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-indigo-600 tracking-wider">
              {item.trackingCode}
            </span>
                        <StatusBadge status={item.currentStatus} />
                    </div>

                    {/* Название */}
                    <p className="mt-1 truncate text-sm font-medium text-gray-900">
                        {item.title}
                    </p>

                    {/* Мини-хронология */}
                    {timeline.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-1">
                            {timeline.map((step, i) => (
                                <React.Fragment key={i}>
                                    {i > 0 && (
                                        <span className="text-gray-300 text-xs select-none">›</span>
                                    )}
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

                    {/* Дата последнего обновления */}
                    <p className="mt-2 text-xs text-gray-400">
                        Обновлён:{' '}
                        {new Date(item.updatedAt).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                </div>

                {/* Правая часть — кнопки */}
                <div className="flex flex-shrink-0 flex-col gap-2">
                    <button
                        onClick={onShowHistory}
                        className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                        История →
                    </button>
                    <button
                        onClick={onRemove}
                        disabled={isRemoving}
                        className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-100 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                        {isRemoving ? '...' : 'Удалить'}
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

// ── Утилита ───────────────────────────────────────────────────────────────────

function pluralize(n: number, one: string, few: string, many: string): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
}