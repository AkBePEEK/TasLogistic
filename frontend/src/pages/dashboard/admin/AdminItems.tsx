import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi, AdminItem } from '@/api/admin';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Status } from '@/types';

const STATUSES: { value: Status; label: string }[] = [
    { value: 'CREATED',    label: 'Создан' },
    { value: 'PROCESSING', label: 'Обработка' },
    { value: 'SHIPPED',    label: 'Отправлен' },
    { value: 'IN_TRANSIT', label: 'В пути' },
    { value: 'DELIVERED',  label: 'Доставлен' },
    { value: 'CANCELLED',  label: 'Отменён' },
];

export function AdminItems() {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-items', page, search],
        queryFn: () =>
            adminApi.getItems(page, 20, search || undefined).then((r) => r.data.data),
        placeholderData: (prev) => prev,
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            adminApi.updateStatus(id, status),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['admin-items'] });
            setEditingId(null);
            toast.success('Статус обновлён');
        },
        onError: () => toast.error('Не удалось обновить статус'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminApi.deleteItem(id),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['admin-items'] });
            toast.success('Заказ удалён');
        },
        onError: () => toast.error('Не удалось удалить заказ'),
    });

    const totalPages = data ? Math.ceil(data.total / 20) : 1;

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">
                    Все заказы{' '}
                    {data && (
                        <span className="text-lg font-normal text-gray-400">
              ({data.total})
            </span>
                    )}
                </h1>
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
                    placeholder="Поиск по трек-коду, получателю..."
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
            </div>

            {/* Таблица */}
            {isLoading ? (
                <LoadingSkeleton rows={5} />
            ) : data?.items.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-sm text-gray-500">Ничего не найдено</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    {/* Шапка таблицы — только desktop */}
                    <div className="hidden grid-cols-[1.2fr_1fr_1fr_1.2fr_1fr_0.8fr_0.8fr_1fr] items-center gap-4 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 lg:grid">
                        <span>Трек-код</span>
                        <span>Получатель</span>
                        <span>Продавец</span>
                        <span>Маршрут</span>
                        <span>Статус</span>
                        <span>Сумма</span>
                        <span>Дата</span>
                        <span>Действия</span>
                    </div>

                    {/* Строки */}
                    <div className="divide-y divide-gray-100">
                        {data?.items.map((item) => (
                            <AdminRow
                                key={item.id}
                                item={item}
                                isEditing={editingId === item.id}
                                onEdit={() => setEditingId(item.id)}
                                onCancelEdit={() => setEditingId(null)}
                                onStatusChange={(status) => statusMutation.mutate({ id: item.id, status })}
                                onDelete={() => {
                                    if (confirm(`Удалить заказ ${item.trackingCode}?`)) {
                                        deleteMutation.mutate(item.id);
                                    }
                                }}
                                isPending={statusMutation.isPending}
                                isDeleting={deleteMutation.isPending && deleteMutation.variables === item.id}
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
    return (
        <div className="px-5 py-4">
            {/* Desktop layout */}
            <div className="hidden grid-cols-[1.2fr_1fr_1fr_1.2fr_1fr_0.8fr_0.8fr_1fr] items-center gap-4 lg:grid">
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
                                {STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
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

                {/* Дата + кнопка */}
                <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {new Date(item.createdAt).toLocaleDateString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric',
            })}
          </span>
                    {!isEditing && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onEdit}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                            >
                                Изменить
                            </button>
                            <button
                                onClick={onDelete}
                                disabled={isDeleting}
                                className="text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-40"
                            >
                                {isDeleting ? '...' : 'Удалить'}
                            </button>
                        </div>
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
            {new Date(item.createdAt).toLocaleDateString('ru-RU')}
          </span>
                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="text-sm font-medium text-red-500 disabled:opacity-40"
                    >
                        {isDeleting ? '...' : 'Удалить'}
                    </button>
                    <button
                        onClick={isEditing ? onCancelEdit : onEdit}
                        className="text-sm font-medium text-indigo-600"
                    >
                        {isEditing ? 'Отмена' : 'Изменить'}
                    </button>
                </div>

                {isEditing && (
                    <select
                        defaultValue={item.currentStatus}
                        onChange={(e) => onStatusChange(e.target.value)}
                        disabled={isPending}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                        {STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
}