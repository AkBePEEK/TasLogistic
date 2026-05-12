import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { TrackResult, ApiResponse } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {LogoLink} from "@/components/LogoLink";
import { useSocket } from '@/hooks/useSocket';
import {LanguageSwitcher} from "@/components/LanguageSwitcher";
import {useTranslation} from "react-i18next";
import {formatDate} from "../../../backend/src/utils/formatDate";

const Schema = z.object({
    code: z
        .string()
        .min(6, 'Минимум 6 символов')
        .max(64)
        .regex(/^[A-Z0-9-]+$/, 'Только заглавные буквы, цифры и дефис')
        .transform((v) => v.toUpperCase()),
});
type Form = z.infer<typeof Schema>;

export function TrackPage() {
    const [activeCode, setActiveCode] = useState<string | null>(null);
    const { i18n, t } = useTranslation();
    const { register, handleSubmit, formState: { errors } } = useForm<Form>({
        resolver: zodResolver(Schema),
    });

    useSocket(activeCode);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['track', activeCode],
        queryFn: () =>
            apiClient
                .get<ApiResponse<TrackResult>>(`/track/${activeCode}`)
                .then((r) => r.data.data),
        enabled: !!activeCode,
    });

    return (
        <div className="flex min-h-screen flex-col bg-gray-50">
            {/* Header */}
            <header className="relative flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                {/* Логотип — по центру на десктопе, слева на мобильном */}
                <div className="flex items-center lg:absolute lg:left-1/2 lg:-translate-x-1/2">
                    <LogoLink clickable={true} size="lg" />
                </div>

                {/* Пустой div для выравнивания flex на мобильном */}
                <div className="lg:invisible">
                    <LogoLink clickable={false} size="lg" />
                </div>

                {/* Кнопки справа */}
                <div className="flex items-center gap-3">
                    <LanguageSwitcher />
                    <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
                        {t('track.login')}
                    </Link>
                    <Link to="/register" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        {t('track.register')}
                    </Link>
                </div>
            </header>

            {/* Main */}
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
                <div className="w-full max-w-lg">
                    <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">
                        {t('track.title')}
                    </h1>
                    <p className="mb-8 text-center text-sm text-gray-500">
                        {t('track.subtitle')}
                    </p>

                    <form
                        onSubmit={handleSubmit((v) => setActiveCode(v.code))}
                        className="flex gap-2"
                    >
                        <input
                            {...register('code')}
                            placeholder="TRK-202406-XXXXXXXX"
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:font-sans focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        <button
                            type="submit"
                            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                        >
                            {t('track.search', { code: activeCode })}
                        </button>
                    </form>

                    {errors.code && (
                        <p className="mt-1.5 text-xs text-red-600">{errors.code.message}</p>
                    )}

                    {/* Результат */}
                    {isLoading && (
                        <div className="mt-8 flex justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                        </div>
                    )}

                    {isError && (
                        <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                            {t('track.notFound')}
                        </div>
                    )}

                    {data && (
                        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-gray-400">Трек-код</p>
                                    <p className="font-mono text-sm font-semibold">{data.trackingCode}</p>
                                </div>
                                <StatusBadge status={data.currentStatus} large />
                            </div>

                            <p className="mb-5 font-semibold text-gray-900">{data.title}</p>

                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                {t('track.statusHistory')}
                            </p>
                            <ol className="relative ml-2 border-l-2 border-gray-100">
                                {data.statusHistory.map((entry, i) => (
                                    <li key={i} className="relative ml-5 pb-4 last:pb-0">
                                        <span className="absolute -left-[25px] top-1 h-4 w-4 rounded-full bg-indigo-400 ring-2 ring-white" />
                                        <div className="flex items-center justify-between">
                                            <StatusBadge status={entry.newStatus} />
                                            <time className="text-xs text-gray-400">
                                                {formatDate(entry.changedAt, i18n.language)}
                                            </time>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}