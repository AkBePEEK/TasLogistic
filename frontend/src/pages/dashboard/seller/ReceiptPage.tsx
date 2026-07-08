import React, {useEffect, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {ItemDetail, sellerApi} from '@/api/seller';
import {CarrierType} from '@/api/carrier';
import {useTranslation} from 'react-i18next';
import {formatDate} from '@/utils/formatDate';

const STATUS_LABEL: Record<string, string> = {
    CREATED:    'status.CREATED',
    PROCESSING: 'status.PROCESSING',
    SHIPPED:    'status.SHIPPED',
    IN_TRANSIT: 'status.IN_TRANSIT',
    DELIVERED:  'status.DELIVERED',
    CANCELLED:  'status.CANCELLED',
};

const DELIVERY_TYPES: { value: CarrierType; label: string }[] = [
    { value: 'AVIA',  label: '✈️ Авиа' },
    { value: 'RAIL',  label: '🚂 ЖД' },
    { value: 'TRUCK', label: '🚛 Фура' },
];

const DELIVERY_LABEL: Record<CarrierType, string> = {
    AVIA:  '✈ АВИА',
    RAIL:  '🚂 ЖД',
    TRUCK: '🚛 ФУРА',
};

// Физическая ширина в пикселях для термопринтера 203 DPI:
// 80мм → 576px, 58мм → 384px
const PRINTER_PX: Record<58 | 80, number> = { 80: 576, 58: 384 };

function drawReceipt(
    canvas: HTMLCanvasElement,
    item: ItemDetail,
    deliveryType: CarrierType,
    widthMm: 58 | 80,
    t: (key: string) => string,
    lang: string,
    forPrinter = false, // true = точный размер для печати, false = увеличенный для экрана
) {
    // При forPrinter=true используем точный физический размер принтера (576 или 384px)
    // При forPrinter=false умножаем на SCALE для нормального отображения на экране
    const SCALE = forPrinter ? 1 : 2;
    const W = PRINTER_PX[widthMm] * SCALE;
    const PADDING = (widthMm === 80 ? 12 : 8) * SCALE;
    const CONTENT_W = W - PADDING * 2;

    // Шрифты подобраны под физический DPI принтера
    const BASE_FONT   = (widthMm === 58 ? 14 : 17) * SCALE;
    const SMALL_FONT  = BASE_FONT - 2 * SCALE;
    const TITLE_FONT  = BASE_FONT + 6 * SCALE;
    const TRACK_FONT  = BASE_FONT + 3 * SCALE;

    const LINE_H       = BASE_FONT + 7 * SCALE;
    const SMALL_LINE_H = SMALL_FONT + 5 * SCALE;

    const ctx = canvas.getContext('2d')!;

    function measureLines(text: string, font: string, maxW: number): string[] {
        ctx.font = font;
        const words = text.split(' ');
        const lines: string[] = [];
        let current = '';
        for (const word of words) {
            const test = current ? current + ' ' + word : word;
            if (ctx.measureText(test).width > maxW && current) {
                lines.push(current);
                current = word;
            } else {
                current = test;
            }
        }
        if (current) lines.push(current);
        return lines;
    }

    function fontStr(size: number, bold = false) {
        return `${bold ? 'bold ' : ''}${size}px Arial, Helvetica, sans-serif`;
    }

    type Block =
        | { type: 'title'; text: string }
        | { type: 'subtitle'; text: string }
        | { type: 'dispatcher'; text: string }
        | { type: 'divider' }
        | { type: 'row'; label: string; value: string; bold?: boolean }
        | { type: 'delivery'; text: string }
        | { type: 'track'; text: string }
        | { type: 'comment'; label: string; text: string }
        | { type: 'disclaimer'; text: string };

    const blocks: Block[] = [
        { type: 'title',      text: t('receipt.title') },
        { type: 'subtitle',   text: t('receipt.subtitle') },
        { type: 'dispatcher', text: 'ДИСПЕТЧЕР: 8(747)-033-9028' },
        { type: 'divider' },
        { type: 'row', label: t('receipt.from'), value: item.fromCity ?? '—' },
        { type: 'row', label: t('receipt.to'),   value: item.toCity   ?? '—' },
        { type: 'delivery', text: DELIVERY_LABEL[deliveryType] },
        { type: 'divider' },
        { type: 'row', label: t('receipt.recipient'),   value: item.recipientName  ?? '—' },
        { type: 'row', label: t('receipt.phone'),       value: item.recipientPhone ?? '—' },
        { type: 'divider' },
        { type: 'row', label: t('receipt.sender'),      value: item.senderName  ?? '—' },
        { type: 'row', label: t('receipt.senderPhone'), value: item.senderPhone ?? '—' },
        { type: 'divider' },
        { type: 'row', label: t('receipt.operator'),    value: item.operatorName ?? '—' },
        { type: 'divider' },
        { type: 'row', label: t('receipt.item'), value: item.title },
        ...(item.itemsCount
            ? [{ type: 'row' as const, label: t('receipt.itemsCount'), value: String(item.itemsCount) }]
            : []),
        ...(item.weight
            ? [{ type: 'row' as const, label: t('receipt.weight'), value: `${item.weight} кг` }]
            : []),
        ...(item.cashOnDelivery && item.cashOnDelivery > 0
            ? [{ type: 'row' as const, label: t('receipt.cod'), value: `${item.cashOnDelivery.toLocaleString('ru-RU')} ₸`, bold: true }]
            : []),
        { type: 'row', label: t('receipt.status'), value: t(STATUS_LABEL[item.currentStatus] ?? item.currentStatus) },
        { type: 'row', label: t('receipt.date'),   value: formatFullDate(item.createdAt, lang) },
        ...(item.comment
            ? [
                { type: 'divider' as const },
                { type: 'comment' as const, label: t('receipt.comment'), text: item.comment },
            ]
            : []),
        { type: 'divider' },
        { type: 'track', text: `Трек-код: ${item.trackingCode}` },
        { type: 'divider' },
        { type: 'disclaimer', text: t('receipt.disclaimer') },
    ];

    // Считаем высоту
    let totalH = PADDING * 2;
    for (const b of blocks) {
        switch (b.type) {
            case 'title':      totalH += TITLE_FONT + 6 * SCALE; break;
            case 'subtitle':   totalH += SMALL_FONT + 4 * SCALE; break;
            case 'dispatcher': totalH += SMALL_FONT + 5 * SCALE; break;
            case 'divider':    totalH += 8 * SCALE; break;
            case 'delivery':   totalH += LINE_H + 4 * SCALE; break;
            case 'track':      totalH += TRACK_FONT + 6 * SCALE; break;
            case 'row': {
                const lines = measureLines(b.value, fontStr(BASE_FONT, true), CONTENT_W / 2);
                totalH += Math.max(1, lines.length) * LINE_H;
                break;
            }
            case 'comment': {
                const lines = measureLines(b.text, fontStr(SMALL_FONT), CONTENT_W - ctx.measureText(b.label + ': ').width);
                totalH += Math.max(1, lines.length) * SMALL_LINE_H + 3 * SCALE;
                break;
            }
            case 'disclaimer': {
                const lines = measureLines(b.text, fontStr(SMALL_FONT - SCALE), CONTENT_W);
                totalH += lines.length * (SMALL_FONT - SCALE + 4 * SCALE) + 3 * SCALE;
                break;
            }
        }
    }

    canvas.width  = W;
    canvas.height = totalH;
    // Для экранного превью масштабируем CSS-размер
    if (!forPrinter) {
        canvas.style.width  = `${W / SCALE}px`;
        canvas.style.height = `${totalH / SCALE}px`;
    }

    const c = canvas.getContext('2d')!;
    c.fillStyle = '#fff';
    c.fillRect(0, 0, W, totalH);
    c.fillStyle = '#000';
    c.textBaseline = 'top';

    let y = PADDING;

    for (const b of blocks) {
        switch (b.type) {
            case 'title': {
                c.font = fontStr(TITLE_FONT, true);
                c.textAlign = 'center';
                c.fillText(b.text, W / 2, y);
                y += TITLE_FONT + 6 * SCALE;
                break;
            }
            case 'subtitle': {
                c.font = fontStr(SMALL_FONT);
                c.textAlign = 'center';
                c.fillText(b.text, W / 2, y);
                y += SMALL_FONT + 4 * SCALE;
                break;
            }
            case 'dispatcher': {
                c.font = fontStr(SMALL_FONT, true);
                c.textAlign = 'center';
                c.fillText(b.text, W / 2, y);
                y += SMALL_FONT + 5 * SCALE;
                break;
            }
            case 'divider': {
                c.setLineDash([4 * SCALE, 3 * SCALE]);
                c.strokeStyle = '#555';
                c.lineWidth = SCALE;
                c.beginPath();
                c.moveTo(PADDING, y + 3 * SCALE);
                c.lineTo(W - PADDING, y + 3 * SCALE);
                c.stroke();
                c.setLineDash([]);
                y += 8 * SCALE;
                break;
            }
            case 'row': {
                c.textAlign = 'left';
                c.font = fontStr(BASE_FONT);
                c.fillStyle = '#555';
                c.fillText(b.label + ':', PADDING, y);

                c.fillStyle = '#000';
                c.font = fontStr(BASE_FONT, true);
                c.textAlign = 'right';

                const valW = CONTENT_W / 2;
                const lines = measureLines(b.value, fontStr(BASE_FONT, true), valW);
                for (const line of lines) {
                    c.fillText(line, W - PADDING, y);
                    y += LINE_H;
                }
                if (lines.length === 0) y += LINE_H;
                break;
            }
            case 'delivery': {
                c.font = fontStr(BASE_FONT, true);
                c.textAlign = 'center';
                c.strokeStyle = '#000';
                c.lineWidth = SCALE;
                c.setLineDash([]);
                const tw = c.measureText(b.text).width + 12 * SCALE;
                const bx = W - PADDING - tw;
                c.strokeRect(bx, y - SCALE, tw, LINE_H + 3 * SCALE);
                c.fillStyle = '#000';
                c.fillText(b.text, bx + tw / 2, y + SCALE);
                y += LINE_H + 4 * SCALE;
                break;
            }
            case 'track': {
                c.font = fontStr(TRACK_FONT, true);
                c.textAlign = 'left';
                c.fillStyle = '#333';
                c.fillText(b.text, PADDING, y);
                y += TRACK_FONT + 6 * SCALE;
                break;
            }
            case 'comment': {
                c.font = fontStr(SMALL_FONT);
                c.textAlign = 'left';
                c.fillStyle = '#555';
                const labelW = c.measureText(b.label + ': ').width;
                c.fillText(b.label + ': ', PADDING, y);
                c.fillStyle = '#000';
                const lines = measureLines(b.text, fontStr(SMALL_FONT), CONTENT_W - labelW);
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line !== undefined) {
                        c.fillText(line, PADDING + (i === 0 ? labelW : 0), y);
                    }
                    y += SMALL_LINE_H;
                }
                y += 3 * SCALE;
                break;
            }
            case 'disclaimer': {
                const fSize = SMALL_FONT - SCALE;
                c.font = fontStr(fSize);
                c.textAlign = 'left';
                c.fillStyle = '#444';
                const lines = measureLines(b.text, fontStr(fSize), CONTENT_W);
                for (const line of lines) {
                    c.fillText(line, PADDING, y);
                    y += fSize + 4 * SCALE;
                }
                y += 3 * SCALE;
                break;
            }
        }
        c.fillStyle = '#000';
        c.textAlign = 'left';
    }
}

function formatFullDate(dateInput: string | Date, lang: string): string {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return formatDate(dateInput as string, lang);
    const dd  = String(date.getDate()).padStart(2, '0');
    const mm  = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh  = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss  = String(date.getSeconds()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy}, ${hh}:${min}:${ss}`;
}

export function ReceiptPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [deliveryType, setDeliveryType] = useState<CarrierType>('TRUCK');

    const canvas80Ref = useRef<HTMLCanvasElement>(null);
    const canvas58Ref = useRef<HTMLCanvasElement>(null);

    const { data: item, isLoading, isError } = useQuery({
        queryKey: ['seller-item', id],
        queryFn: () => sellerApi.getItemById(id as string).then((r) => r.data.data),
        enabled: !!id,
    });

    useEffect(() => {
        if (!item) return;
        const lang = i18n.language ?? 'ru';
        if (canvas80Ref.current) drawReceipt(canvas80Ref.current, item, deliveryType, 80, t, lang, false);
        if (canvas58Ref.current) drawReceipt(canvas58Ref.current, item, deliveryType, 58, t, lang, false);
    }, [item, deliveryType, t, i18n.language]);

    // Скачиваем PNG точного физического размера под принтер (forPrinter=true)
    const handleDownloadReceipt = (width: 58 | 80) => {
        if (!item) return;
        const lang = i18n.language ?? 'ru';

        // Создаём off-screen canvas с точным размером для принтера
        const offscreen = document.createElement('canvas');
        drawReceipt(offscreen, item, deliveryType, width, t, lang, true);

        const dataUrl = offscreen.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Чек_${item.trackingCode}_${width}mm.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50"
                >
                    {t('receipt.back')}
                </button>

                <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    {DELIVERY_TYPES.map((dt) => (
                        <button
                            key={dt.value}
                            onClick={() => setDeliveryType(dt.value)}
                            className={[
                                'px-3 py-2 text-sm font-medium transition-colors',
                                deliveryType === dt.value
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-50',
                            ].join(' ')}
                        >
                            {dt.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => handleDownloadReceipt(80)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                    💾 Скачать чек 80 мм
                </button>

                <button
                    onClick={() => handleDownloadReceipt(58)}
                    className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600"
                >
                    💾 Скачать чек 58 мм
                </button>
            </div>

            <div className="flex flex-wrap gap-6">
                <div>
                    <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">80 мм</p>
                    <div className="inline-block border border-dashed border-gray-300 bg-white shadow">
                        <canvas ref={canvas80Ref} style={{ display: 'block', maxWidth: '100%' }} />
                    </div>
                </div>
                <div>
                    <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">58 мм</p>
                    <div className="inline-block border border-dashed border-gray-300 bg-white shadow">
                        <canvas ref={canvas58Ref} style={{ display: 'block', maxWidth: '100%' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}