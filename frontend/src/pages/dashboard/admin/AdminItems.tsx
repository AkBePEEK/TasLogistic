import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi, AdminItem } from '@/api/admin';
import { CarrierType } from '@/api/carrier';
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
const TO_CITIES = [
    'Актау', "Атырау", "Актобе", "Уральск", "Куль сары", "Жанаозен",
    "Бейнеу", "Сексеул", "Кандагаш", "Казалы" , "Шалкар", "Арал", "Шетпе", "Алга"
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

// Тип транспорта — пустое значение = все
const DELIVERY_TYPE_OPTIONS: { value: '' | CarrierType; label: string }[] = [
    { value: '',      label: 'carriers.allTypes' },
    { value: 'AVIA',  label: 'carrierType.AVIA' },
    { value: 'RAIL',  label: 'carrierType.RAIL' },
    { value: 'TRUCK', label: 'carrierType.TRUCK' },
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
    const [deliveryType, setDeliveryType] = useState<'' | CarrierType>('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkStatus, setBulkStatus] = useState('');
    const [, setShowBulkPanel] = useState(false);

    // Дата для печати дневного списка — по умолчанию сегодня
    const [printDate, setPrintDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [isPrinting, setIsPrinting] = useState(false);

    const hasActiveFilters = status || fromCity || toCity || dateFrom || dateTo || deliveryType;

    const resetFilters = () => {
        setStatus('');
        setFromCity('');
        setToCity('');
        setDateFrom('');
        setDateTo('');
        setDeliveryType('');
        setPage(1);
    };

    const { data, isLoading } = useQuery({
        queryKey: ['admin-items', page, search, status, fromCity, toCity, dateFrom, dateTo, deliveryType],
        queryFn: () =>
            adminApi.getItems({
                page, limit: 20,
                search: search || undefined,
                status: status || undefined,
                fromCity: fromCity || undefined,
                toCity: toCity || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                deliveryType: deliveryType || undefined,
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

    const bulkMutation = useMutation({
        mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
            adminApi.bulkUpdateStatus(ids, status),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['admin-items'] });
            setSelectedIds(new Set());
            setBulkStatus('');
            setShowBulkPanel(false);
            toast.success(`Статус обновлён для ${selectedIds.size} заказов`);
        },
        onError: () => toast.error('Ошибка при массовом обновлении'),
    });

    const totalPages = data ? Math.ceil(data.total / 20) : 1;

    // ── Печать списка за день ──────────────────────────────────────────────────

    const handlePrintDaily = async () => {
        setIsPrinting(true);
        try {
            const res = await adminApi.getDailyList({
                date: printDate,
                deliveryType: deliveryType || undefined,
            });
            const { items, date } = res.data.data!;

            const win = window.open('', '_blank');
            if (!win) {
                toast.error(t('common.popupBlocked'));
                return;
            }

            const deliveryLabel = deliveryType
                ? t(`carrierType.${deliveryType}`)
                : t('carriers.allTypes');

            const rowsHtml = items.map((item, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${item.trackingCode}</td>
                    <td>${item.recipientName ?? '—'}</td>
                    <td>${item.recipientPhone ?? '—'}</td>
                    <td>${item.fromCity ?? '—'} → ${item.toCity ?? '—'}</td>
                    <td>${item.weight ? item.weight + ' кг' : '—'}</td>
                    <td>${item.cashOnDelivery ? item.cashOnDelivery.toLocaleString('ru-RU') + ' ₸' : '—'}</td>
                    <td>${item.deliveryType ? t(`carrierType.${item.deliveryType}`) : '—'}</td>
                    <td>${t(STATUS_OPTIONS.find((s) => s.value === item.currentStatus)?.label ?? '')}</td>
                </tr>
            `).join('');

            const totalWeight = items.reduce((sum, it) => sum + (it.weight ?? 0), 0);
            const totalAmount = items.reduce((sum, it) => sum + (it.cashOnDelivery ?? 0), 0);

            const html = `
                <!DOCTYPE html>
                <html lang="ru">
                <head>
                    <meta charset="utf-8" />
                    <title>Список заказов ${date}</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
                        h1 { font-size: 18px; margin-bottom: 4px; }
                        .subtitle { font-size: 13px; color: #555; margin-bottom: 16px; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                        th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; }
                        th { background: #f0f0f0; font-weight: bold; }
                        tfoot td { font-weight: bold; background: #fafafa; }
                        @media print {
                            @page { size: A4; margin: 12mm; }
                        }
                    </style>
                </head>
                <body>
                    <h1>Список заказов за ${date}</h1>
                    <p class="subtitle">Тип транспорта: ${deliveryLabel} · Всего заказов: ${items.length}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Трек-код</th>
                                <th>Получатель</th>
                                <th>Телефон</th>
                                <th>Маршрут</th>
                                <th>Вес</th>
                                <th>Наложенный платёж</th>
                                <th>Транспорт</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml || '<tr><td colspan="9" style="text-align:center;">Нет заказов за выбранную дату</td></tr>'}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="5">Итого</td>
                                <td>${totalWeight.toFixed(1)} кг</td>
                                <td>${totalAmount.toLocaleString('ru-RU')} ₸</td>
                                <td colspan="2"></td>
                            </tr>
                        </tfoot>
                    </table>
                </body>
                </html>
            `;

            const styleAndBody = win.document;
            styleAndBody.open();
            styleAndBody.write(html);
            styleAndBody.close();

            // Печатаем после полной загрузки разметки
            win.onload = () => {
                win.focus();
                win.print();
            };
        } catch {
            toast.error(t('common.printError'));
        } finally {
            setIsPrinting(false);
        }
    };

    const allPageIds = data?.items.map((i) => i.id) ?? [];
    const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
    const someSelected = selectedIds.size > 0;

    const toggleItem = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(allPageIds));
        }
    };

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

            {/* Панель мультивыбора */}
            {someSelected && (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                    <span className="text-sm font-medium text-green-700">
                      ✓ Выбрано: {selectedIds.size}
                    </span>
                    <select
                        value={bulkStatus}
                        onChange={(e) => setBulkStatus(e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                    >
                        <option value="">Выберите статус...</option>
                        {STATUS_OPTIONS.filter((s) => s.value).map((s) => (
                            <option key={s.value} value={s.value}>{t(s.label)}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => {
                            if (!bulkStatus) { toast.error('Выберите статус'); return; }
                            if (confirm(`Изменить статус для ${selectedIds.size} заказов?`)) {
                                bulkMutation.mutate({ ids: Array.from(selectedIds), status: bulkStatus });
                            }
                        }}
                        disabled={!bulkStatus || bulkMutation.isPending}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {bulkMutation.isPending ? 'Обновление...' : 'Применить'}
                    </button>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Сбросить выбор
                    </button>
                </div>
            )}

            {/* Панель печати списка за день */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <span className="text-sm font-medium text-indigo-700">
                    🖨 {t('common.printDailyList')}
                </span>
                <input
                    type="date"
                    value={printDate}
                    onChange={(e) => setPrintDate(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                {/* Тип транспорта применяется и к печати, фильтр общий */}
                <select
                    value={deliveryType}
                    onChange={(e) => { setDeliveryType(e.target.value as '' | CarrierType); setPage(1); }}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                    {DELIVERY_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{t(o.label)}</option>
                    ))}
                </select>
                <button
                    onClick={handlePrintDaily}
                    disabled={isPrinting}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                    {isPrinting ? t('common.printing') : `🖨 ${t('common.print')}`}
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

                        {/* Тип транспорта */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                {t('carriers.type')}
                            </label>
                            <select
                                value={deliveryType}
                                onChange={(e) => { setDeliveryType(e.target.value as '' | CarrierType); setPage(1); }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            >
                                {DELIVERY_TYPE_OPTIONS.map((o) => (
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
                                {TO_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
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
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="min-w-[800px] grid grid-cols-[auto_1.2fr_1fr_1fr_1.2fr_1fr_0.8fr_0.8fr_1fr] items-center gap-4 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 lg:grid">
                        {/* ← Чекбокс выбрать все */}
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
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
                                isSelected={selectedIds.has(item.id)}
                                onToggleSelect={() => toggleItem(item.id)}
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
    isSelected: boolean;
    onToggleSelect: () => void;
    onEdit: () => void;
    onCancelEdit: () => void;
    onStatusChange: (status: string) => void;
    onDelete: () => void;
    isPending: boolean;
    isDeleting: boolean;
}

function AdminRow({
                      item, isSelected, onToggleSelect,
                      isEditing, onEdit, onCancelEdit,
                      onStatusChange, onDelete, isPending, isDeleting,
                  }: AdminRowProps) {
    const { i18n, t } = useTranslation();
    return (
        <div className="px-5 py-4">
            {/* Desktop layout */}
            <div className="min-w-[800px] grid grid-cols-[auto_1.2fr_1fr_1fr_1.2fr_1fr_0.8fr_0.8fr_1fr] items-center gap-4 lg:grid">

                {/* ← Чекбокс */}
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggleSelect}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    onClick={(e) => e.stopPropagation()}
                />

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
                    {item.deliveryType && (
                        <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                            {t(`carrierType.${item.deliveryType}`)}
                        </span>
                    )}
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
            <div className="space-y-2 md:hidden">

                <div className="flex items-center gap-2">
                    {/* ← Чекбокс мобильный */}
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggleSelect}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                    />
                    <span className="font-mono text-sm font-semibold text-indigo-600">
                      {item.trackingCode}
                    </span>
                </div>
                <StatusBadge status={item.currentStatus} />

                {item.recipientName && (
                    <p className="text-sm text-gray-700">{item.recipientName}</p>
                )}

                {(item.fromCity || item.toCity) && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>{item.fromCity ?? '—'}</span>
                        <span>→</span>
                        <span className="font-medium text-gray-700">{item.toCity ?? '—'}</span>
                        {item.deliveryType && (
                            <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                                {t(`carrierType.${item.deliveryType}`)}
                            </span>
                        )}
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