import { jsx as _jsx } from "react/jsx-runtime";
const CONFIG = {
    CREATED: { label: 'Создан', classes: 'bg-gray-100 text-gray-700' },
    PROCESSING: { label: 'Обработка', classes: 'bg-blue-100 text-blue-700' },
    SHIPPED: { label: 'Отправлен', classes: 'bg-yellow-100 text-yellow-700' },
    IN_TRANSIT: { label: 'В пути', classes: 'bg-orange-100 text-orange-700' },
    DELIVERED: { label: 'Доставлен', classes: 'bg-green-100 text-green-700' },
    CANCELLED: { label: 'Отменён', classes: 'bg-red-100 text-red-700' },
};
export function StatusBadge({ status, large = false, }) {
    const { label, classes } = CONFIG[status];
    return (_jsx("span", { className: [
            'inline-flex items-center rounded-full font-medium',
            large ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs',
            classes,
        ].join(' '), children: label }));
}
