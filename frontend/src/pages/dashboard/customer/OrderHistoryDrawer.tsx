import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '@/api/customer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Status } from '@/types';

interface Props {
    itemId: string;
    onClose: () => void;
}

const TIMELINE_DOT: Record<Status, string> = {
    CREATED:    'bg-gray-400',
    PROCESSING: 'bg-blue-500',
    SHIPPED:    'bg-yellow-500',
    IN_TRANSIT: 'bg-orange-500',
    DELIVERED:  'bg-green-500',
    CANCELLED:  'bg-red-400',
};

export function OrderHistoryDrawer({ itemId, onClose }: Props) {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['customer-history', itemId],
        queryFn: () => customerApi.getHistory(itemId).then((r) => r.data.data),
    });

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Панель */}
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="История заказа"
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
            >
                {/* Шапка */}
                <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">История заказа</h2>
                        {data && (
                            <>
                                <p className="mt-0.5 font-mono text-xs font-semibold tracking-wider text-indigo-600">
                                    {data.trackingCode}
                                </p>
                                <p className="mt-0.5 text-sm text-gray-600">{data.title}</p>
                            </>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Закрыть"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z" />
                        </svg>
                    </button>
                </div>

                {/* Тело */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {isLoading && (
                        <div className="flex h-full items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                        </div>
                    )}

                    {isError && (
                        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                            Не удалось загрузить историю. Попробуйте ещё раз.
                        </div>
                    )}

                    {data && (
                        <div className="space-y-6">
                            {/* Текущий статус */}
                            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm font-medium text-gray-600">
                  Текущий статус
                </span>
                                <StatusBadge status={data.currentStatus} large />
                            </div>

                            {/* Временная шкала */}
                            <div>
                                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
                                    Хронология — {data.statusHistory.length}{' '}
                                    {pluralize(
                                        data.statusHistory.length,
                                        'событие',
                                        'события',
                                        'событий'
                                    )}
                                </p>

                                <ol className="relative ml-2 border-l-2 border-gray-100">
                                    {data.statusHistory.map((entry, idx) => {
                                        const isFirst = idx === 0;
                                        const isLast = idx === data.statusHistory.length - 1;

                                        return (
                                            <li
                                                key={entry.id}
                                                className={`relative ml-5 ${isLast ? 'pb-0' : 'pb-5'}`}
                                            >
                        <span
                            className={[
                                'absolute -left-[25px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white',
                                TIMELINE_DOT[entry.newStatus],
                            ].join(' ')}
                        />

                                                <div className="rounded-lg border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2">
                                                            {!isFirst && (
                                                                <span className="text-xs text-gray-300">
                                  {entry.oldStatus} →
                                </span>
                                                            )}
                                                            <StatusBadge status={entry.newStatus} />
                                                        </div>
                                                        <time className="flex-shrink-0 text-xs tabular-nums text-gray-400">
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
                            </div>

                            {/* Метаданные */}
                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500">
                                {data.description && (
                                    <p className="mb-3 text-sm text-gray-600">{data.description}</p>
                                )}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between">
                                        <span>Заказ создан</span>
                                        <span className="font-medium tabular-nums">
                      {new Date(data.createdAt).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                      })}
                    </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Добавлен в отслеживание</span>
                                        <span className="font-medium tabular-nums">
                      {new Date(data.addedAt).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                      })}
                    </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}

function pluralize(n: number, one: string, few: string, many: string): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
}