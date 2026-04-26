import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { sellerApi } from '@/api/seller';
import toast from "react-hot-toast";

const Schema = z.object({
    title: z.string().min(2, 'Минимум 2 символа').max(255),
    description: z.string().max(1000).optional(),
});
type Form = z.infer<typeof Schema>;

export function CreateItem() {
    const navigate = useNavigate();
    const qc = useQueryClient();

    const { register, handleSubmit, formState: { errors } } = useForm<Form>({
        resolver: zodResolver(Schema),
    });

    const mutation = useMutation({
        mutationFn: (data: Form) => sellerApi.createItem(data).then((r) => r.data.data),
        onSuccess: (item) => {
            void qc.invalidateQueries({ queryKey: ['seller-items'] });
            toast.success(`Товар создан. Трек-код: ${item?.trackingCode}`); // ← добавить
            navigate('/dashboard/seller/items');
        },
        onError: () => {
            toast.error('Ошибка при создании товара'); // ← добавить
        },
    });

    return (
        <div className="max-w-lg space-y-6">
            <div className="flex items-center gap-3">
                <Link
                    to="/dashboard/seller/items"
                    className="text-sm text-gray-400 hover:text-gray-600"
                >
                    ← Назад
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Новый товар</h1>
            </div>

            <form
                onSubmit={handleSubmit((d) => mutation.mutate(d))}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
            >
                <div className="rounded-lg bg-indigo-50 px-4 py-3">
                    <p className="text-xs text-indigo-600">
                        Трек-код будет сгенерирован автоматически в формате{' '}
                        <span className="font-mono font-semibold">TRK-YYYYMM-XXXXXXXX</span>
                    </p>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Название <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('title')}
                        placeholder="Ноутбук Dell XPS 15"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    {errors.title && (
                        <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
                    )}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Описание</label>
                    <textarea
                        {...register('description')}
                        rows={3}
                        placeholder="Необязательное описание..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                </div>

                {mutation.isError && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        Ошибка при создании товара
                    </div>
                )}

                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    {mutation.isPending ? 'Создание...' : 'Создать товар'}
                </button>
            </form>
        </div>
    );
}