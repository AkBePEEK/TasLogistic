import React from 'react';
import { Status } from '@/types';
import {useTranslation} from "react-i18next";

const CONFIG: Record<Status, { label: string; classes: string }> = {
    CREATED:    { label: 'status.CREATED',    classes: 'bg-gray-100 text-gray-700' },
    PROCESSING: { label: 'status.PROCESSING', classes: 'bg-blue-100 text-blue-700' },
    SHIPPED:    { label: 'status.SHIPPED', classes: 'bg-yellow-100 text-yellow-700' },
    IN_TRANSIT: { label: 'status.IN_TRANSIT',    classes: 'bg-orange-100 text-orange-700' },
    DELIVERED:  { label: 'status.DELIVERED', classes: 'bg-green-100 text-green-700' },
    CANCELLED:  { label: 'status.CANCELLED',   classes: 'bg-red-100 text-red-700' },
};

export function StatusBadge({status, large = false,}: {
    status: Status;
    large?: boolean;
}) {
    const { label, classes } = CONFIG[status];
    const { t } = useTranslation();
    return (
        <span
            className={[
                'inline-flex items-center rounded-full font-medium',
                large ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs',
                classes,
            ].join(' ')}
        >
      {t(label)}
    </span>
    );
}