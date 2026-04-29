import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import {ItemDetail, sellerApi} from '@/api/seller';

const STATUS_LABEL: Record<string, string> = {
    CREATED:    'Создан',
    PROCESSING: 'Обработка',
    SHIPPED:    'Отправлен',
    IN_TRANSIT: 'В пути',
    DELIVERED:  'Доставлен',
    CANCELLED:  'Отменён',
};

export function ReceiptPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: item, isLoading, isError } = useQuery({
        queryKey: ['seller-item', id],
        queryFn: () => sellerApi.getItemById(id!).then((r) => r.data.data),
        enabled: !!id,
    });

    // Автоматически открываем диалог печати после загрузки
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
                <p className="text-red-600">Заказ не найден</p>
                <button onClick={() => navigate(-1)} className="text-indigo-600 underline">
                    Назад
                </button>
            </div>
        );
    }

    const trackingUrl = `https://taslogistic.kz/track/${item.trackingCode}`;

    return (
        <>
            {/* ── Кнопки управления — скрываются при печати ── */}
            <div className="no-print fixed bottom-6 right-6 z-50 flex gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-lg hover:bg-gray-50"
                >
                    ← Назад
                </button>
                <button
                    onClick={() => window.print()}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700"
                >
                    🖨 Печать
                </button>
            </div>

            {/* ── Чек 80мм ── */}
            {item && (
                <>
                    <div className="receipt-80">
                        <Receipt item={item} trackingUrl={trackingUrl} width={80} />
                    </div>
                    <div className="receipt-58">
                        <Receipt item={item} trackingUrl={trackingUrl} width={58} />
                    </div>
                </>
            )}
        </>
    );
}

// ── Компонент чека ────────────────────────────────────────────────────────────

function Receipt({item, trackingUrl, width,}: {
    item: ItemDetail;
    trackingUrl: string;
    width: 58 | 80;
})
{
    const fontSize = width === 58 ? '10px' : '11px';
    const qrSize = width === 58 ? 80 : 100;

    return (
        <div
            style={{
                width: `${width}mm`,
                fontFamily: 'monospace',
                fontSize,
                padding: '4mm 3mm',
                color: '#000',
                backgroundColor: '#fff',
            }}
        >
            {/* Шапка */}
            <div style={{ textAlign: 'center', marginBottom: '3mm' }}>
                <div style={{ fontWeight: 'bold', fontSize: width === 58 ? '13px' : '15px' }}>
                    TAS LOGISTIC
                </div>
                <div style={{ fontSize: width === 58 ? '9px' : '10px', marginTop: '1mm' }}>
                    Логистическая служба
                </div>
            </div>

            <Divider />

            {/* Трек-код */}
            <div style={{ textAlign: 'center', margin: '2mm 0' }}>
                <div style={{ fontSize: width === 58 ? '9px' : '10px', color: '#555' }}>
                    Трек-код
                </div>
                <div style={{
                    fontWeight: 'bold',
                    fontSize: width === 58 ? '12px' : '14px',
                    letterSpacing: '1px',
                    marginTop: '1mm',
                }}>
                    {item.trackingCode}
                </div>
            </div>

            <Divider />

            {/* Маршрут */}
            <Row label="Откуда" value={item.fromCity ?? '—'} />
            <Row label="Куда" value={item.toCity ?? '—'} />

            <Divider />

            {/* Получатель */}
            <Row label="Получатель" value={item.recipientName ?? '—'} />
            <Row label="Телефон" value={item.recipientPhone ?? '—'} />

            <Divider />

            {/* Параметры */}
            <Row label="Товар" value={item.title} />
            {item.weight && <Row label="Вес" value={`${item.weight} кг`} />}
            {item.cashOnDelivery && item.cashOnDelivery > 0 && (
                <Row
                    label="Наложенный платёж"
                    value={`${item.cashOnDelivery.toLocaleString('ru-RU')} ₸`}
                    bold
                />
            )}
            <Row label="Статус" value={STATUS_LABEL[item.currentStatus] ?? item.currentStatus} />
            <Row
                label="Дата"
                value={new Date(item.createdAt).toLocaleString('ru-RU', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                })}
            />

            {item.comment && (
                <>
                    <Divider />
                    <div style={{ fontSize: width === 58 ? '9px' : '10px' }}>
                        <span style={{ color: '#555' }}>Комментарий: </span>
                        {item.comment}
                    </div>
                </>
            )}

            <Divider />

            {/* QR-код */}
            <div style={{ textAlign: 'center', margin: '3mm 0' }}>
                <QRCodeSVG
                    value={trackingUrl}
                    size={qrSize}
                    level="M"
                    marginSize={0}
                />
                <div style={{
                    fontSize: '8px',
                    color: '#777',
                    marginTop: '1mm',
                    wordBreak: 'break-all',
                }}>
                    {trackingUrl}
                </div>
            </div>

            <Divider />

            {/* Футер */}
            <div style={{ textAlign: 'center', fontSize: '8px', color: '#777', marginTop: '2mm' }}>
                Спасибо за доверие!
            </div>
        </div>
    );
}

function Divider() {
    return (
        <div style={{
            borderTop: '1px dashed #ccc',
            margin: '2mm 0',
        }} />
    );
}

function Row({
                 label, value, bold = false,
             }: {
    label: string;
    value: string;
    bold?: boolean;
}) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '2mm',
            marginBottom: '1mm',
            fontWeight: bold ? 'bold' : 'normal',
        }}>
            <span style={{ color: '#555', flexShrink: 0 }}>{label}:</span>
            <span style={{ textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
        </div>
    );
}