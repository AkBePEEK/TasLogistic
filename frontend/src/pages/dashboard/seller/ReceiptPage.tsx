import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sellerApi, ItemDetail } from '@/api/seller';
import { carriersApi, Carrier, CarrierType } from '@/api/carrier';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/utils/formatDate';

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

// ── Canvas receipt renderer ───────────────────────────────────────────────────

function drawReceipt(
  canvas: HTMLCanvasElement,
  item: ItemDetail,
  deliveryType: CarrierType,
  carriers: Carrier[],
  widthMm: 58 | 80,
  t: (key: string) => string,
  lang: string,
) {
  const W = widthMm === 80 ? 576 : 384;
  const PADDING = widthMm === 80 ? 20 : 14;
  const CONTENT_W = W - PADDING * 2;

  // ← Увеличенные размеры шрифта
  const BASE_FONT = widthMm === 58 ? 24 : 28;
  const SMALL_FONT = BASE_FONT - 4;
  const TITLE_FONT = BASE_FONT + 10;
  const TRACK_FONT = BASE_FONT + 6;

  const LINE_H = BASE_FONT + 12;
  const SMALL_LINE_H = SMALL_FONT + 10;

    // Первый проход — считаем высоту
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
        return `${bold ? 'bold ' : ''}${size}px "Courier New", monospace`;
    }

    // Собираем строки чека
    type Block =
        | { type: 'title'; text: string }
        | { type: 'subtitle'; text: string }
        | { type: 'dispatcher'; text: string }
        | { type: 'divider' }
        | { type: 'row'; label: string; value: string; bold?: boolean }
        | { type: 'delivery'; text: string }
        | { type: 'track'; text: string }
        | { type: 'carriers-title'; text: string }
        | { type: 'carrier'; name: string; phone: string }
        | { type: 'comment'; label: string; text: string }
        | { type: 'disclaimer'; text: string };

    const blocks: Block[] = [
        { type: 'title', text: t('receipt.title') },
        { type: 'subtitle', text: t('receipt.subtitle') },
        { type: 'dispatcher', text: 'ДИСПЕТЧЕР: 8(747)-033-9028' },
        { type: 'divider' },
        { type: 'row', label: t('receipt.from'), value: item.fromCity ?? '—' },
        { type: 'row', label: t('receipt.to'), value: item.toCity ?? '—' },
        { type: 'delivery', text: DELIVERY_LABEL[deliveryType] },
        { type: 'divider' },
        { type: 'row', label: t('receipt.recipient'), value: item.recipientName ?? '—' },
        { type: 'row', label: t('receipt.phone'), value: item.recipientPhone ?? '—' },
        { type: 'divider' },
        { type: 'row', label: t('receipt.sender'), value: item.senderName ?? '—' },
        { type: 'row', label: t('receipt.senderPhone'), value: item.senderPhone ?? '—' },
        { type: 'divider' },
        { type: 'row', label: t('receipt.item'), value: item.title },
        ...(item.weight ? [{ type: 'row' as const, label: t('receipt.weight'), value: `${item.weight} кг` }] : []),
        ...(item.cashOnDelivery && item.cashOnDelivery > 0
            ? [{ type: 'row' as const, label: t('receipt.cod'), value: `${item.cashOnDelivery.toLocaleString('ru-RU')} ₸`, bold: true }]
            : []),
        { type: 'row', label: t('receipt.status'), value: t(STATUS_LABEL[item.currentStatus] ?? item.currentStatus) },
        { type: 'row', label: t('receipt.date'), value: formatDate(item.createdAt, lang) },
        ...(item.comment
            ? [
                { type: 'divider' as const },
                { type: 'comment' as const, label: t('receipt.comment'), text: item.comment },
            ]
            : []),
        { type: 'divider' },
        { type: 'track', text: `Трек-код: ${item.trackingCode}` },
        ...(carriers.length > 0
            ? [
                { type: 'divider' as const },
                { type: 'carriers-title' as const, text: `${t('receipt.carriers')}:` },
                ...carriers.map((c) => ({ type: 'carrier' as const, name: `${c.name} ${c.city}:`, phone: c.phone })),
            ]
            : []),
        { type: 'divider' },
        { type: 'disclaimer', text: t('receipt.disclaimer') },
    ];

    // Считаем высоту
    let totalH = PADDING * 2;
    for (const b of blocks) {
        switch (b.type) {
            case 'title':       totalH += TITLE_FONT + 10; break;
            case 'subtitle':    totalH += SMALL_FONT + 6; break;
            case 'dispatcher':  totalH += SMALL_FONT + 8; break;
            case 'divider':     totalH += 12; break;
            case 'delivery':    totalH += LINE_H + 4; break;
            case 'track':       totalH += TRACK_FONT + 10; break;
            case 'carriers-title': totalH += SMALL_LINE_H; break;
            case 'carrier':     totalH += SMALL_LINE_H; break;
            case 'row': {
                const lines = measureLines(b.value, fontStr(BASE_FONT), CONTENT_W / 2);
                totalH += Math.max(1, lines.length) * LINE_H;
                break;
            }
            case 'comment': {
                const lines = measureLines(b.text, fontStr(SMALL_FONT), CONTENT_W - ctx.measureText(b.label + ': ').width);
                totalH += Math.max(1, lines.length) * SMALL_LINE_H + 4;
                break;
            }
            case 'disclaimer': {
                const lines = measureLines(b.text, fontStr(SMALL_FONT - 2), CONTENT_W);
                totalH += lines.length * (SMALL_FONT - 2 + 5) + 4;
                break;
            }
        }
    }

    canvas.width = W;
    canvas.height = totalH;

    // Рисуем
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
                y += TITLE_FONT + 10;
                break;
            }
            case 'subtitle': {
                c.font = fontStr(SMALL_FONT);
                c.textAlign = 'center';
                c.fillText(b.text, W / 2, y);
                y += SMALL_FONT + 6;
                break;
            }
            case 'dispatcher': {
                c.font = fontStr(SMALL_FONT, true);
                c.textAlign = 'center';
                c.fillText(b.text, W / 2, y);
                y += SMALL_FONT + 8;
                break;
            }
            case 'divider': {
              c.setLineDash([6, 6]);        // было [4, 4]
              c.strokeStyle = '#888';       // было #aaa — темнее для контраста
              c.lineWidth = 2;              // было 1
              c.beginPath();
              c.moveTo(PADDING, y + 5);
              c.lineTo(W - PADDING, y + 5);
              c.stroke();
              c.setLineDash([]);
              y += 14;
              break;
            }
            case 'row': {
              c.textAlign = 'left';
              c.font = fontStr(BASE_FONT, b.bold);
              c.fillStyle = '#666';
              c.fillText(b.label + ':', PADDING, y);
            
              c.fillStyle = '#000';
              c.font = fontStr(BASE_FONT, true); // ← всегда bold для значений, не только когда b.bold
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
              c.lineWidth = 2.5;            // было 1.5
              c.setLineDash([]);
              const tw = c.measureText(b.text).width + 24;
              const bx = W - PADDING - tw;
              c.strokeRect(bx, y - 2, tw, LINE_H + 6);
              c.fillStyle = '#000';
              c.fillText(b.text, bx + tw / 2, y + 2);
              y += LINE_H + 6;
              break;
            }
            case 'track': {
                c.font = fontStr(TRACK_FONT, true);
                c.textAlign = 'left';
                c.fillStyle = '#555';
                c.fillText(b.text, PADDING, y);
                y += TRACK_FONT + 10;
                break;
            }
            case 'carriers-title': {
                c.font = fontStr(SMALL_FONT, true);
                c.textAlign = 'left';
                c.fillStyle = '#000';
                c.fillText(b.text, PADDING, y);
                y += SMALL_LINE_H;
                break;
            }
            case 'carrier': {
                c.font = fontStr(SMALL_FONT, true);
                c.textAlign = 'left';
                c.fillStyle = '#000';
                c.fillText(b.name, PADDING, y);
                c.font = fontStr(SMALL_FONT);
                c.textAlign = 'right';
                c.fillText(b.phone, W - PADDING, y);
                y += SMALL_LINE_H;
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
                y += 4;
                break;
            }
            case 'disclaimer': {
                const fSize = SMALL_FONT - 2;
                c.font = fontStr(fSize);
                c.textAlign = 'left';
                c.fillStyle = '#444';
                const lines = measureLines(b.text, fontStr(fSize), CONTENT_W);
                for (const line of lines) {
                    c.fillText(line, PADDING, y);
                    y += fSize + 5;
                }
                y += 4;
                break;
            }
        }
        c.fillStyle = '#000';
        c.textAlign = 'left';
    }
}

// ── Страница ──────────────────────────────────────────────────────────────────

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

    const { data: carriers = [] } = useQuery({
        queryKey: ['carriers'],
        queryFn: () => carriersApi.getByCity(undefined).then((r) => r.data.data ?? []),
        enabled: !!item,
    });

    const uniqueCarriers = carriers.filter(
        (c, i, arr) => arr.findIndex((x) => x.phone === c.phone) === i
    );

    // Рисуем canvas при изменении данных или типа доставки
    useEffect(() => {
        if (!item) return;
        const lang = i18n.language ?? 'ru';
        if (canvas80Ref.current) {
            drawReceipt(canvas80Ref.current, item, deliveryType, uniqueCarriers, 80, t, lang);
        }
        if (canvas58Ref.current) {
            drawReceipt(canvas58Ref.current, item, deliveryType, uniqueCarriers, 58, t, lang);
        }
    }, [item, deliveryType, carriers, t, i18n.language]);

    // Функция печати через canvas → изображение
    const handlePrint = (width: 58 | 80) => {
        const canvas = width === 80 ? canvas80Ref.current : canvas58Ref.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL('image/png');
        const win = window.open('', '_blank');
        if (!win) return;

        const style = win.document.createElement('style');
        style.textContent = `
            * { margin: 0; padding: 0; }
            body { background: #fff; }
            img { display: block; width: 100%; }
            @media print {
                @page { margin: 0; size: ${width}mm auto; }
                img { width: 100%; }
            }
        `;
        win.document.head.appendChild(style);

        const img = win.document.createElement('img');
        img.src = dataUrl;
        img.alt = 'receipt';
        img.onload = () => { win.print(); win.close(); };
        win.document.body.appendChild(img);
    };

    const handlePrintRawBT = async (width: 58 | 80) => {
      const canvas = width === 80 ? canvas80Ref.current : canvas58Ref.current;
      if (!canvas) return;
    
      // RawBT принимает изображение через intent с base64
      canvas.toBlob((blob) => {
        if (!blob) return;
    
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // RawBT image intent
          window.location.href = `rawbt:${base64}`;
        };
        reader.readAsDataURL(blob);
      }, 'image/png');
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
            {/* Панель управления */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50"
                >
                    ← {t('receipt.back')}
                </button>

                {/* Тип доставки */}
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

                {/* Кнопки печати */}
                <button
                    onClick={() => handlePrint(80)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                    🖨 80 мм {t("receipt.print")}
                </button>
                <button
                    onClick={() => handlePrint(58)}
                    className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600"
                >
                    🖨 58 мм {t("receipt.print")}
                </button>

                {/* ← RawBT кнопки для Bluetooth-принтеров */}
                <button
                  onClick={() => handlePrintRawBT(80)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                >
                  📶 80 мм RawBT
                </button>
                <button
                  onClick={() => handlePrintRawBT(58)}
                  className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600"
                >
                  📶 58 мм RawBT
                </button>
            </div>

            {/* Превью чеков */}
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
