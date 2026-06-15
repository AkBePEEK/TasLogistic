import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sellerApi } from '@/api/seller';
import { carriersApi, Carrier, CarrierType } from '@/api/carrier';


const STATUS_LABEL: Record<string, string> = {
    CREATED:    'status.CREATED',
    PROCESSING: 'status.PROCESSING',
    SHIPPED:    'status.SHIPPED',
    IN_TRANSIT: 'status.IN_TRANSIT',
    DELIVERED:  'status.DELIVERED',
    CANCELLED:  'status.CANCELLED'
};

const DELIVERY_TYPES: { value: CarrierType; label: string }[] = [
    { value: 'AVIA',  label: '✈️ Авиа' },
    { value: 'RAIL',  label: '🚂 ЖД' },
    { value: 'TRUCK', label: '🚛 Фура' },
];

export function ReceiptPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [deliveryType, setDeliveryType] = useState<CarrierType>('TRUCK');
    const { t } = useTranslation();

    const { data: item, isLoading, isError } = useQuery({
        queryKey: ['seller-item', id],
        queryFn: () => sellerApi.getItemById(id!).then((r) => r.data.data),
        enabled: !!id,
    });

    // Загружаем перевозчиков по городу назначения
    const { data: carriers } = useQuery({
        queryKey: ['carriers'],
        queryFn: () =>
            carriersApi.getByCity(undefined).then((r) => r.data.data ?? []),
        enabled: !!item,
    });

    useEffect(() => {
        if (item) {
            const timer = setTimeout(() => window.print(), 800);
            return () => clearTimeout(timer);
        }
    }, [item]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    if (isError || !item) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <p className="text-red-600">{t('receipt.notFound')}</p>
                <button onClick={() => navigate(-1)} className="text-indigo-600 underline">{t('common.back')}</button>
            </div>
        );
    }

    return (
        <>
            {/* Кнопки и выбор типа доставки — скрываются при печати */}
            <div className="no-print fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                {/* Выбор типа доставки */}
                <div className="flex rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                    {DELIVERY_TYPES.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => setDeliveryType(t.value)}
                            className={[
                                'px-3 py-2 text-sm font-medium transition-colors',
                                deliveryType === t.value
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-50',
                            ].join(' ')}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-lg hover:bg-gray-50"
                    >
                        {t('receipt.back')}
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700"
                    >
                        {t('receipt.print')}
                    </button>
                </div>
            </div>

            {createPortal(
                <div id="receipt-root">
                    <div className="receipt-80">
                        <Receipt item={item} deliveryType={deliveryType} carriers={carriers ?? []} width={80} />
                    </div>
                    <div className="receipt-58">
                        <Receipt item={item} deliveryType={deliveryType} carriers={carriers ?? []} width={58} />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

// ── Компонент чека ────────────────────────────────────────────────────────────

import { ItemDetail } from '@/api/seller';
import {useTranslation} from "react-i18next";
import {formatDate} from "../../../../../backend/src/utils/formatDate";
import {createPortal} from "react-dom";

function Receipt({
                     item,
                     deliveryType,
                     carriers,
                     width,
                 }: {
    item: ItemDetail;
    deliveryType: CarrierType;
    carriers: Carrier[];
    width: 58 | 80;
})
{
    const fontSize = width === 58 ? '10px' : '11px';
    const { i18n, t } = useTranslation();

    // Фильтруем перевозчиков по выбранному типу доставки
    const filteredCarriers = carriers;

    return (
        <div style={{
            width: `${width}mm`,
            fontFamily: '"Courier New", "DejaVu Sans Mono", monospace',
            fontSize,
            padding: '4mm 3mm',
            color: '#000',
            backgroundColor: '#fff',
        }}>
            {/* Шапка */}
            <div style={{ textAlign: 'center', marginBottom: '3mm' }}>
                <div style={{ fontWeight: 'bold', fontSize: width === 58 ? '13px' : '15px' }}>
                    {t('receipt.title')}
                </div>
                <div style={{ fontSize: width === 58 ? '9px' : '10px', marginTop: '1mm' }}>
                    {t('receipt.subtitle')}
                </div>
                <div style={{ fontSize: width === 58 ? '9px' : '10px', marginTop: '1mm', fontWeight: 'bold' }}>
                    ДИСПЕТЧЕР:  8(747)-033-9028
                </div>
            </div>

            <Divider />

            {/* Маршрут + тип доставки в ряд */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Row label={t('receipt.from')} value={item.fromCity ?? '—'} />
                    <Row label={t('receipt.to')} value={item.toCity ?? '—'} />
                </div>
                <div style={{
                    border: '1px solid #000',
                    borderRadius: '3px',
                    padding: '2mm 3mm',
                    textAlign: 'center',
                    fontSize: width === 58 ? '9px' : '10px',
                    fontWeight: 'bold',
                    marginLeft: '2mm',
                    flexShrink: 0,
                }}>
                    {deliveryType === 'AVIA'  && '✈️\nАВИА'}
                    {deliveryType === 'RAIL'  && '🚂\nЖД'}
                    {deliveryType === 'TRUCK' && '🚛\nФУРА'}
                </div>
            </div>

            <Divider />

            {/* Получатель */}
            <Row label={t('receipt.recipient')} value={item.recipientName ?? '—'} />
            <Row label={t('receipt.phone')} value={item.recipientPhone ?? '—'} />

            <Divider />

            {/* Отправитель */}
            <Row label={t('receipt.sender')} value={item.senderName ?? '—'} />
            <Row label={t('receipt.senderPhone')} value={item.senderPhone ?? '—'} />

            <Divider />

            {/* Параметры */}
            <Row label={t('receipt.item')} value={item.title} />
            {item.weight && <Row label={t('receipt.weight')} value={`${item.weight} кг`} />}
            {item.cashOnDelivery !== undefined && item.cashOnDelivery > 0 && (
                <Row
                    label={t('receipt.cod')}
                    value={`${item.cashOnDelivery.toLocaleString('ru-RU')} ₸`}
                    bold
                />
            )}
            <Row label={t('receipt.status')} value={t(STATUS_LABEL[item.currentStatus] ?? item.currentStatus)} />
            <Row label={t('receipt.date')} value={formatDate(item.createdAt, i18n.language)} />

            {item.comment && (
                <>
                    <Divider />
                    <div style={{ fontSize: '9px' }}>
                        <span style={{ color: '#555' }}>{t('receipt.comment')}: </span>
                        {item.comment}
                    </div>
                </>
            )}

            <Divider />

            <div style={{ color: '#777', fontWeight: 'bold',
                fontSize: width === 58 ? '12px' : '14px',
                letterSpacing: '1px',
                marginTop: '1mm',}}>
                Трек-код: {item.trackingCode}
            </div>

            {/* Контакты перевозчиков */}
            {filteredCarriers.length > 0 && (
                <>
                    <Divider />
                    <div style={{ fontSize: '9px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '1mm' }}>
                            {t('receipt.carriers')}:
                        </div>
                        {filteredCarriers.map((c) => (
                            <div key={c.id} style={{ marginBottom: '1mm' }}>
                                <span style={{ fontWeight: 'bold' }}>{c.name + " " + c.city}:</span> {c.phone}
                            </div>
                        ))}
                    </div>
                </>
            )}

            <Divider />

            {/* Дисклеймер */}
            <div style={{
                fontSize: '8px',
                color: '#444',
                textAlign: 'justify',
                lineHeight: '1.4',
                marginTop: '2mm',
            }}>
                {t('receipt.disclaimer')}
            </div>
        </div>
    );
}

function Divider() {
    return <div style={{ borderTop: '1px dashed #ccc', margin: '2mm 0' }} />;
}

function Row({ label, value, bold = false }: {
    label: string; value: string; bold?: boolean;
})
{
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between',
            gap: '2mm', marginBottom: '1mm', fontWeight: bold ? 'bold' : 'normal',
        }}>
            <span style={{ color: '#555', flexShrink: 0 }}>{label}:</span>
            <span style={{ textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
        </div>
    );
}