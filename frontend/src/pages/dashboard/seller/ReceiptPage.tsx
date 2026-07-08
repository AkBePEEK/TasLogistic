import React, {useState} from 'react';
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

// ── Чистый генератор HTML, БЕЗ window.open / window.print ──────────────────
function buildReceiptHtml(
    item: ItemDetail,
    deliveryType: CarrierType,
    width: 58 | 80,
    t: (key: string) => string,
    lang: string,
): string {
    const row = (label: string, value: string, bold = false) =>
        `<tr><td class="label">${label}:</td><td class="value${bold ? ' bold' : ''}">${value}</td></tr>`;

    const divider = () => `<tr><td colspan="2"><hr></td></tr>`;

    let rows = '';
    rows += row(t('receipt.from'), item.fromCity ?? '—');
    rows += row(t('receipt.to'), item.toCity ?? '—');
    rows += `<tr><td colspan="2" style="text-align:right"><span class="delivery-box">${DELIVERY_LABEL[deliveryType]}</span></td></tr>`;
    rows += divider();
    rows += row(t('receipt.recipient'), item.recipientName ?? '—');
    rows += row(t('receipt.phone'), item.recipientPhone ?? '—');
    rows += divider();
    rows += row(t('receipt.sender'), item.senderName ?? '—');
    rows += row(t('receipt.senderPhone'), item.senderPhone ?? '—');
    rows += divider();
    if (item.operatorName) rows += row(t('receipt.operator'), item.operatorName);
    rows += divider();
    rows += row(t('receipt.item'), item.title);
    if (item.itemsCount) rows += row(t('receipt.itemsCount'), String(item.itemsCount));
    if (item.weight) rows += row(t('receipt.weight'), `${item.weight} кг`);
    if (item.cashOnDelivery && item.cashOnDelivery > 0)
        rows += row(t('receipt.cod'), `${item.cashOnDelivery.toLocaleString('ru-RU')} ₸`, true);
    rows += row(t('receipt.status'), t(STATUS_LABEL[item.currentStatus] ?? item.currentStatus));
    rows += row(t('receipt.date'), formatFullDate(item.createdAt, lang));
    if (item.comment) {
        rows += divider();
        rows += `<tr><td colspan="2"><span class="label">${t('receipt.comment')}:</span> ${item.comment}</td></tr>`;
    }
    rows += divider();
    rows += `<tr><td colspan="2" class="track">Трек-код: ${item.trackingCode}</td></tr>`;
    rows += divider();
    rows += `<tr><td colspan="2" class="disclaimer">${t('receipt.disclaimer')}</td></tr>`;

    const isNarrow = width === 58;

    return `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<title>Чек ${item.trackingCode}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
@page { margin:0; size:${width}mm auto; }
body {
    width:${width}mm;
    font-family: Arial, Helvetica, sans-serif;
    font-size: ${isNarrow ? 'small' : 'medium'};
    color:#000;
    background:#fff;
    padding:2mm 3mm;
}
.title { text-align:center; font-size:large; font-weight:bold; margin-bottom:1mm; }
.subtitle { text-align:center; font-size:x-small; margin-bottom:0.5mm; }
.dispatcher { text-align:center; font-size:x-small; font-weight:bold; margin-bottom:1mm; }
table { width:100%; border-collapse:collapse; }
td { padding:0.5mm 0; vertical-align:top; font-size:${isNarrow ? 'small' : 'medium'}; }
td.label { color:#444; white-space:nowrap; width:45%; }
td.value { text-align:right; font-weight:bold; }
hr { border:none; border-top:1px dashed #555; margin:1.5mm 0; }
.delivery-box { display:inline-block; border:1.5px solid #000; padding:0.5mm 2mm; font-weight:bold; }
.track { font-size:medium; font-weight:bold; color:#333; }
.disclaimer { font-size:xx-small; color:#444; text-align:justify; line-height:1.3; }
</style></head>
<body>
<div class="title">TAS LOGISTIC</div>
<div class="subtitle">${t('receipt.subtitle')}</div>
<div class="dispatcher">ДИСПЕТЧЕР: 8(747)-033-9028</div>
<table>${rows}</table>
</body></html>`;
}

export function ReceiptPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [deliveryType, setDeliveryType] = useState<CarrierType>('TRUCK');

    const { data: item, isLoading, isError } = useQuery({
        queryKey: ['seller-item', id],
        queryFn: () => sellerApi.getItemById(id as string).then((r) => r.data.data),
        enabled: !!id,
    });

    // ── Печать через App Link ESC/POS-приложения, БЕЗ canvas и БЕЗ window.print() ──
    const handlePrintReceipt = (width: 58 | 80) => {
        if (!item) return;
        const lang = i18n.language ?? 'ru';
        const html = buildReceiptHtml(item, deliveryType, width, t, lang);

        window.location.href = `print://escpos.org/escpos/bt/print?srcTp=uri&srcObj=html` +
            `&src='data:text/html,${encodeURIComponent(html)}'`;
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

    const lang = i18n.language ?? 'ru';
    const previewHtml80 = buildReceiptHtml(item, deliveryType, 80, t, lang);
    const previewHtml58 = buildReceiptHtml(item, deliveryType, 58, t, lang);

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
                    onClick={() => handlePrintReceipt(80)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                    🖨️ Печать 80 мм
                </button>

                <button
                    onClick={() => handlePrintReceipt(58)}
                    className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600"
                >
                    🖨️ Печать 58 мм
                </button>
            </div>

            <div className="flex flex-wrap gap-6">
                <div>
                    <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">80 мм</p>
                    <div className="inline-block border border-dashed border-gray-300 bg-white shadow" style={{ width: '80mm' }}>
                        <iframe srcDoc={previewHtml80} style={{ width: '100%', height: '600px', border: 'none' }} />
                    </div>
                </div>
                <div>
                    <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">58 мм</p>
                    <div className="inline-block border border-dashed border-gray-300 bg-white shadow" style={{ width: '58mm' }}>
                        <iframe srcDoc={previewHtml58} style={{ width: '100%', height: '600px', border: 'none' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}