import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { carriersApi, Carrier, CARRIER_TYPE_LABELS } from '@/api/carrier';
import {useTranslation} from "react-i18next";

const Schema = z.object({
    name:  z.string().min(2, 'carriers.nameMin'),
    city:  z.string().min(2, 'carriers.cityRequired'),
    phone: z.string().min(7, 'carriers.phoneMin'),
    type:  z.enum(['AVIA', 'RAIL', 'TRUCK']),
});
type Form = z.infer<typeof Schema>;

const CITIES = [
    'Алматы', 'Астана', 'Шымкент', 'Қарағанды', 'Ақтобе', 'Ақтау',
    'Тараз', 'Павлодар', 'Өскемен', 'Семей', 'Атырау', 'Қызылорда', 'Жезқазған',
    'Қостанай', 'Орал', 'Петропавл', 'Түркістан', 'Көкшетау', 'Темиртау'
];

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

export function AdminCarriers() {
    const qc = useQueryClient();
    const [filterCity, setFilterCity] = useState('');
    const [showForm, setShowForm] = useState(false);
    const { t }=  useTranslation();

    const { data: carriers, isLoading } = useQuery({
        queryKey: ['carriers', filterCity],
        queryFn: () =>
            carriersApi.getByCity(filterCity || undefined).then((r) => r.data.data ?? []),
    });

    const { register, handleSubmit, reset, formState: { errors } } =
        useForm<Form>({ resolver: zodResolver(Schema) });

    const createMutation = useMutation({
        mutationFn: (data: Form) => carriersApi.create(data),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['carriers'] });
            reset();
            setShowForm(false);
            toast.success(t('toast.carrierCreated'));
        },
        onError: () => toast.error(t('toast.carrierCreateError')),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => carriersApi.delete(id),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['carriers'] });
            toast.success(t('toast.carrierDeleted'));
        },
        onError: () => toast.error(t('toast.carrierDeleteError')),
    });

    // Группируем по городам
    const grouped = (carriers ?? []).reduce<Record<string, Carrier[]>>((acc, c) => {
        if (!acc[c.city]) acc[c.city] = [];
        acc[c.city]!.push(c);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">
                    {t('nav.carriers')}
                </h1>
                <button
                    onClick={() => { setShowForm((v) => !v); reset(); }}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                    + {t('nav.add')}
                </button>
            </div>

            {/* Форма добавления */}
            {showForm && (
                <form
                    onSubmit={handleSubmit((d) => createMutation.mutate(d))}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4"
                >
                    <h2 className="text-sm font-semibold text-gray-700">
                        {t('carriers.newCarrier')}
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                {t('carriers.name')} *
                            </label>
                            <input {...register('name')} placeholder="ООО Транспорт" className={inputCls} />
                            {errors.name && <p className="mt-1 text-xs text-red-600">{t(`${errors.name.message}`)}</p>}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                {t('carriers.city')} *
                            </label>
                            <select {...register('city')} className={inputCls}>
                                <option value="">
                                    {t('carriers.selectCity')}
                                </option>
                                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {errors.city && <p className="mt-1 text-xs text-red-600">{t(`${errors.city.message}`)}</p>}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                {t('carriers.phone')} *
                            </label>
                            <input {...register('phone')} placeholder="+7 777 123 4567" className={inputCls} />
                            {errors.phone && <p className="mt-1 text-xs text-red-600">{t(`${errors.phone.message}`)}</p>}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                {t('carriers.type')} *
                            </label>
                            <select {...register('type')} className={inputCls}>
                                <option value="AVIA">{t('carrierType.AVIA')}</option>
                                <option value="RAIL">{t('carrierType.RAIL')}</option>
                                <option value="TRUCK">{t('carrierType.TRUCK')}</option>
                            </select>
                            {errors.type && <p className="mt-1 text-xs text-red-600">{t(`${errors.type.message}`)}</p>}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {createMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); reset(); }}
                            className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </form>
            )}

            {/* Фильтр по городу */}
            <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
                <option value="">{t('common.allCities')}</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Список по городам */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
                    ))}
                </div>
            ) : Object.keys(grouped).length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-sm text-gray-500">
                        {t('carriers.noCarriers')}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(grouped).map(([city, list]) => (
                        <div key={city} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                            <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                                <h3 className="text-sm font-semibold text-gray-700">📍 {city}</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {list.map((carrier) => (
                                    <div key={carrier.id} className="flex items-center justify-between px-5 py-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-gray-500">
                                                  {CARRIER_TYPE_LABELS[carrier.type]}
                                                </span>
                                                <span className="text-sm font-semibold text-gray-800">
                                                  {carrier.name}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-sm text-gray-500">{carrier.phone}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (confirm(`Удалить ${carrier.name}?`)) {
                                                    deleteMutation.mutate(carrier.id);
                                                }
                                            }}
                                            className="text-xs font-medium text-red-500 hover:text-red-700"
                                        >
                                            {t('orders.remove')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}