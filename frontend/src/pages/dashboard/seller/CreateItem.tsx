import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { sellerApi } from '@/api/seller';
import toast from "react-hot-toast";
import {CreateItemSchema, TO_CITY_LIST} from "@/schemas";
import {useTranslation} from "react-i18next";

type Form = z.infer<typeof CreateItemSchema>;

function Field({label, error, required = false, children,}: {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
})
{
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

export function CreateItem() {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { t } = useTranslation();

    const {register, handleSubmit, formState: {errors}} = useForm<Form>({
        resolver: zodResolver(CreateItemSchema),
        defaultValues: {cashOnDelivery: 0, deliveryType: 'TRUCK', fromCity: 'Алматы', itemsCount: 1, operatorName: ''},
    });

    const mutation = useMutation({
        mutationFn: (data: Form) => sellerApi.createItem(data).then((r) => r.data.data),
        onSuccess: (item) => {
            void qc.invalidateQueries({ queryKey: ['seller-items'] });
            toast.success(`Отправка создана. Трек-код: ${item?.trackingCode}`);
            // ← Редирект на страницу чека
            navigate(`/dashboard/seller/items/${item?.id}/receipt`);
        },
        onError: () => toast.error(t('toast.createItemError')),
    });

    return (
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/dashboard/seller/items" className="text-sm text-gray-400 hover:text-gray-600">
                    {t('common.back')}
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                    {t('createItem.title')}
                </h1>
            </div>

            <form
                onSubmit={handleSubmit((d) => mutation.mutate(d))}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5"
            >
                {/* Информация о получателе */}
                <div>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                        {t('createItem.recipientSection')}
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label={t('createItem.recipientName')} error={errors.recipientName?.message} required>
                            <input
                                {...register('recipientName')}
                                placeholder={t('createItem.recipientNamePlaceholder')}
                                className={inputCls}
                            />
                        </Field>
                        <Field label={t('createItem.phone')} error={errors.recipientPhone?.message} required>
                            <input
                                {...register('recipientPhone')}
                                placeholder={t('createItem.phonePlaceholder')}
                                className={inputCls}
                            />
                        </Field>
                    </div>
                </div>

                {/* Информация об отправителе */}
                <div>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                        {t('receipt.sender')}
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label={t("createItem.senderName")} error={errors.senderName?.message} required>
                            <input
                                {...register('senderName')}
                                value="Гульнур"
                                className={inputCls}
                            />
                        </Field>
                        <Field label={t('createItem.phone')} error={errors.senderPhone?.message} required>
                            <input
                                {...register('senderPhone')}
                                value="+7 747 033 9028"
                                className={inputCls}
                            />
                        </Field>
                    </div>
                </div>

                {/* Маршрут */}
                <div>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                        {t('createItem.routeSection')}
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Откуда — фиксировано на "Алматы", выбор отключён */}
                        <Field label={t('createItem.fromCity')} error={errors.fromCity?.message} required>
                            <input
                                {...register('fromCity')}
                                value="Алматы"
                                readOnly
                                disabled
                                className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed`}
                            />
                        </Field>
                        <Field label={t('createItem.toCity')} error={errors.toCity?.message} required>
                            <select {...register('toCity')} className={inputCls}>
                                <option value="">
                                    {t('createItem.selectCity')}
                                </option>
                                {TO_CITY_LIST.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </Field>
                    </div>
                </div>

                {/* Тип доставки */}
                <div>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                        {t('carriers.type')}
                    </h2>
                    <Field label={t('carriers.type')} error={errors.deliveryType?.message} required>
                        <select {...register('deliveryType')} className={inputCls}>
                            <option value="TRUCK">{t('carrierType.TRUCK')}</option>
                            <option value="AVIA">{t('carrierType.AVIA')}</option>
                            <option value="RAIL">{t('carrierType.RAIL')}</option>
                        </select>
                    </Field>
                </div>

                {/* Оператор — кто принял заказ */}
                <div>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                        {t('createItem.operatorSection')}
                    </h2>
                    <Field label={t('createItem.operatorName')} error={errors.operatorName?.message} required>
                        <input
                            {...register('operatorName')}
                            value={'Айдос'}
                            className={inputCls}
                        />
                    </Field>
                </div>

                {/* Название и комментарий */}
                <div className="space-y-4">
                    <Field label={t('createItem.itemTitle')}  error={errors.title?.message} required>
                        <input
                            {...register('title')}
                            placeholder={t('createItem.titlePlaceholder')}
                            className={inputCls}
                        />
                    </Field>
                </div>

                {/* Параметры — количество мест, вес, наложенный платёж */}
                <div>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                        {t('createItem.paramsSection')}
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {/* Количество мест — между товаром и весом по требованию чека */}
                        <Field label={t('createItem.itemsCount')} error={errors.itemsCount?.message} required>
                            <input
                                {...register('itemsCount')}
                                type="number"
                                step="1"
                                min="1"
                                placeholder={t('createItem.itemsCountPlaceholder')}
                                className={inputCls}
                            />
                        </Field>
                        <Field label={t('createItem.weight')} error={errors.weight?.message} required>
                            <input
                                {...register('weight')}
                                type="number"
                                step="0.1"
                                placeholder={t('createItem.weightPlaceholder')}
                                className={inputCls}
                            />
                        </Field>
                        <Field label={t('createItem.cashOnDelivery')}  error={errors.cashOnDelivery?.message}>
                            <input
                                {...register('cashOnDelivery')}
                                type="number"
                                placeholder={t('createItem.codPlaceholder')}
                                className={inputCls}
                            />
                        </Field>
                    </div>
                </div>

                {/* Комментарий */}
                <div className="space-y-4">
                    <Field label={t('createItem.comment')}  error={errors.comment?.message}>
                        <textarea
                            {...register('comment')}
                            rows={3}
                            placeholder={t('createItem.commentPlaceholder')}
                            className={inputCls}
                        />
                    </Field>
                </div>

                {/* Информация о трек-коде */}
                <div className="rounded-lg bg-indigo-50 px-4 py-3">
                    <p className="text-xs text-indigo-600">
                        {t('createItem.trackingCodeInfo') + ' '}
                        <span className="font-mono font-semibold">TRK-YYYYMM-XXXXXXXX</span>
                    </p>
                </div>

                {mutation.isError && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {t('toast.createItemError')}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {mutation.isPending
                            ? t('createItem.creating')
                            : t('createItem.createButton')
                        }
                    </button>
                    <Link
                        to="/dashboard/seller/items"
                        className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        {t('common.cancel')}
                    </Link>
                </div>
            </form>
        </div>
    );
}