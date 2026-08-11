import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ItemDetail, sellerApi } from '@/api/seller';
import { CarrierType } from '@/api/carrier';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/utils/formatDate';
import { jsPDF } from 'jspdf';
import { registerCyrillicFont } from '@/utils/registerPdfFont';

const STATUS_LABEL: Record<string, string> = {
    CREATED: 'status.CREATED',
    PROCESSING: 'status.PROCESSING',
    SHIPPED: 'status.SHIPPED',
    IN_TRANSIT: 'status.IN_TRANSIT',
    DELIVERED: 'status.DELIVERED',
    CANCELLED: 'status.CANCELLED',
};
const DELIVERY_LABEL: Record<CarrierType, string> = {
    AVIA: 'АВИА',
    RAIL: 'ЖД',
    TRUCK: 'ФУРА',
};

function formatFullDate(dateInput: string | Date, lang: string): string {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return formatDate(dateInput as string, lang);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy}, ${hh}:${min}:${ss}`;
}

function setSemiBold(pdf: jsPDF, strokeWidth = 0.12) {
    pdf.setLineWidth(strokeWidth);
    pdf.setDrawColor(0); // цвет обводки — под цвет текущей заливки текста
}

function textSemiBold(pdf: jsPDF, text: string, x: number, y: number, opts: any = {}) {
    pdf.text(text, x, y, { ...opts, renderingMode: 'fillThenStroke' });
}


// ── Отрисовка контента чека на уже созданном pdf, возвращает финальный Y (нужную высоту) ──
function renderReceiptContent(
    pdf: jsPDF,
    item: ItemDetail,
    deliveryType: CarrierType,
    widthMm: 58 | 80,
    t: (key: string) => string,
    lang: string,
): number {
    registerCyrillicFont(pdf);

    const margin = widthMm === 80 ? 4 : 3;
    const contentW = widthMm - margin * 2;
    const baseFont = widthMm === 80 ? 9 : 7.5;
    const smallFont = baseFont - 1.2;
    const titleFont = baseFont + 4;
    const trackFont = baseFont + 2;

    let y = margin + 2;

    const center = (text: string, size: number, bold: boolean) => {
        pdf.setFont('PTSans', bold ? 'bold' : 'normal');
        pdf.setFontSize(size);
        pdf.setTextColor(0);
        if (bold) {
            pdf.text(text, widthMm / 2, y, { align: 'center' });
        } else {
            setSemiBold(pdf, 0.1);
            textSemiBold(pdf, text, widthMm / 2, y, { align: 'center' });
        }
    };

    const row = (label: string, value: string) => {
        pdf.setFont('PTSans', 'normal');
        pdf.setFontSize(baseFont);
        pdf.setTextColor(0);
        setSemiBold(pdf, 0.08); // подпись (label) — чуть жирнее обычного
        textSemiBold(pdf, label + ':', margin, y);

        pdf.setFont('PTSans', 'bold'); // значения остаются полностью bold
        pdf.setTextColor(0);
        const valueMaxW = contentW * 0.58;
        const lines = pdf.splitTextToSize(value, valueMaxW) as string[];
        for (const line of lines) {
            pdf.text(line, widthMm - margin, y, { align: 'right' });
            y += baseFont * 0.45 + 1.6;
        }
        pdf.setTextColor(0);
    };

    center(t('receipt.title'), titleFont, true);
    y += titleFont * 0.45 + 1.2;
    center(t('receipt.subtitle'), smallFont, false); // теперь будет semi-bold
    y += smallFont * 0.45 + 1;
    center('ДИСПЕТЧЕР: 8(747)-033-9028', smallFont, true);
    y += smallFont * 0.45 + 1.5;

    row(t('receipt.from'), item.fromCity ?? '—');
    row(t('receipt.to'), item.toCity ?? '—');

    pdf.setFont('PTSans', 'bold');
    pdf.setFontSize(baseFont);
    pdf.setTextColor(0);
    const dLabel = DELIVERY_LABEL[deliveryType];
    const dW = pdf.getTextWidth(dLabel) + 6;
    const boxX = widthMm - margin - dW;
    pdf.setDrawColor(0);
    pdf.rect(boxX, y - baseFont * 0.35, dW, baseFont * 0.5 + 3);
    pdf.text(dLabel, boxX + dW / 2, y, { align: 'center' });
    y += baseFont * 0.45 + 3;

    row(t('receipt.recipient'), item.recipientName ?? '—');
    row(t('receipt.phone'), item.recipientPhone ?? '—');

    row(t('receipt.sender'), item.senderName ?? '—');
    row(t('receipt.senderPhone'), item.senderPhone ?? '—');

    row(t('receipt.operator'), item.operatorName ?? '—');

    row(t('receipt.item'), item.title);
    if (item.itemsCount) row(t('receipt.itemsCount'), String(item.itemsCount));
    if (item.weight) row(t('receipt.weight'), `${item.weight} кг`);
    if (item.cashOnDelivery && item.cashOnDelivery > 0) {
        row(t('receipt.cod'), `${item.cashOnDelivery.toLocaleString('ru-RU')} ₸`);
    }
    row(t('receipt.status'), t(STATUS_LABEL[item.currentStatus] ?? item.currentStatus));
    row(t('receipt.date'), formatFullDate(item.createdAt, lang));

    if (item.comment) {
        pdf.setFont('PTSans', 'normal');
        pdf.setFontSize(smallFont);
        pdf.setTextColor(0);
        const label = t('receipt.comment') + ': ';
        const labelW = pdf.getTextWidth(label);
        pdf.text(label, margin, y);
        pdf.setTextColor(0);
        const lines = pdf.splitTextToSize(item.comment, contentW - labelW) as string[];
        lines.forEach((line, i) => {
            pdf.text(line, margin + (i === 0 ? labelW : 0), y);
            y += smallFont * 0.45 + 1.4;
        });
        y += 1;
    }

    pdf.setFont('PTSans', 'bold');
    pdf.setFontSize(trackFont);
    pdf.setTextColor(0);
    pdf.text(`Трек-код: ${item.trackingCode}`, margin, y);
    y += trackFont * 0.45 + 2.5;
    pdf.setTextColor(0);

    pdf.setFont('PTSans', 'bold');
    pdf.setFontSize(baseFont);
    pdf.setTextColor(0);
    const disclaimerLines = pdf.splitTextToSize(t('receipt.disclaimer'), contentW) as string[];
    pdf.text(disclaimerLines, margin, y, {
        maxWidth: contentW,
        align: 'justify',
    });
    y += disclaimerLines.length * (baseFont * 0.45 + 1.4);
    y += 2;

    return y + margin;
}

// ── Публичная функция: два прохода — черновой (замер) и финальный (отрисовка) ──
function buildReceiptPdf(
    item: ItemDetail,
    deliveryType: CarrierType,
    widthMm: 58 | 80,
    t: (key: string) => string,
    lang: string,
): jsPDF {
    // Проход 1: черновик на заведомо высокой странице — только чтобы узнать нужную высоту
    const draft = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [widthMm, 500] });
    const neededHeight = renderReceiptContent(draft, item, deliveryType, widthMm, t, lang);

    // Проход 2: финальный PDF сразу с правильной высотой страницы
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [widthMm, neededHeight] });
    renderReceiptContent(pdf, item, deliveryType, widthMm, t, lang);

    return pdf;
}

// ── Страница ──────────────────────────────────────────────────────────────────

export function ReceiptPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const { data: item, isLoading, isError } = useQuery({
        queryKey: ['seller-item', id],
        queryFn: () => sellerApi.getItemById(id as string).then((r) => r.data.data),
        enabled: !!id,
    });
    const deliveryType: CarrierType = (item?.deliveryType as CarrierType) ?? 'TRUCK';

    // Собираем PDF-превью для обоих форматов (реальный PDF в iframe — WYSIWYG, без canvas)
    const previewUrl80 = useMemo(() => {
        if (!item) return null;
        return buildReceiptPdf(item, deliveryType, 80, t, i18n.language ?? 'ru').output('datauristring');
    }, [item, deliveryType, t, i18n.language]);

    const previewUrl58 = useMemo(() => {
        if (!item) return null;
        return buildReceiptPdf(item, deliveryType, 58, t, i18n.language ?? 'ru').output('datauristring');
    }, [item, deliveryType, t, i18n.language]);

    const handleDownloadReceipt = (width: 58 | 80) => {
        if (!item) return;
        const pdf = buildReceiptPdf(item, deliveryType, width, t, i18n.language ?? 'ru');
        pdf.save(`Чек_${item.trackingCode || 'order'}_${width}mm.pdf`);
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
                        {previewUrl80 && (
                            <iframe title="receipt-80" src={previewUrl80} style={{ width: 320, height: 500, border: 'none' }} />
                        )}
                    </div>
                </div>
                <div>
                    <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">58 мм</p>
                    <div className="inline-block border border-dashed border-gray-300 bg-white shadow">
                        {previewUrl58 && (
                            <iframe title="receipt-58" src={previewUrl58} style={{ width: 240, height: 500, border: 'none' }} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}