import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

const AddTrackedSchema = z.object({
    trackingCode: z
        .string()
        .min(6)
        .max(64)
        .regex(/^[A-Z0-9-]+$/, 'Только заглавные буквы, цифры и дефис'),
});

/**
 * GET /api/customer/tracked
 */
export async function customerGetTrackedItems(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const trackedItems = await prisma.trackedItem.findMany({
            where: { customerId: req.user.userId },
            orderBy: { addedAt: 'desc' },
            include: {
                item: {
                    select: {
                        id: true,
                        trackingCode: true,
                        title: true,
                        currentStatus: true,
                        createdAt: true,      // ← добавить
                        updatedAt: true,
                        fromCity: true,       // ← добавить
                        toCity: true,         // ← добавить
                        recipientName: true,  // ← добавить
                        weight: true,         // ← добавить
                        statusHistory: {
                            orderBy: { changedAt: 'desc' },
                            take: 3,
                            select: {
                                newStatus: true,
                                changedAt: true,
                            },
                        },
                    },
                },
            },
        });

        // Выводим тип элемента из самого массива
        type TrackedItem = (typeof trackedItems)[number];

        sendSuccess(res, {
            items: trackedItems.map((t: TrackedItem) => ({
                trackedItemId: t.id,
                addedAt: t.addedAt,
                ...t.item,
            })),
            total: trackedItems.length,
        });
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

/**
 * POST /api/customer/tracked
 */
export async function customerAddTrackedItem(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const result = AddTrackedSchema.safeParse(req.body);
    if (!result.success) {
        sendError(res, 400, 'Ошибка валидации', result.error.errors);
        return;
    }

    const { trackingCode } = result.data;

    try {
        const item = await prisma.item.findUnique({
            where: { trackingCode: trackingCode.toUpperCase() },
            select: { id: true, trackingCode: true, title: true, currentStatus: true },
        });

        if (!item) {
            sendError(res, 404, 'Товар с указанным трек-кодом не найден');
            return;
        }

        const tracked = await prisma.trackedItem.upsert({
            where: {
                customerId_itemId: {
                    customerId: req.user.userId,
                    itemId: item.id,
                },
            },
            update: {},
            create: { customerId: req.user.userId, itemId: item.id },
        });

        sendSuccess(res, { trackedItemId: tracked.id, item }, 201, 'Товар добавлен');
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

/**
 * DELETE /api/customer/tracked/:itemId
 */
export async function customerRemoveTrackedItem(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const { itemId } = req.params;

    if (!itemId) {
        sendError(res, 400, 'ID товара обязателен');
        return;
    }

    try {
        const { count } = await prisma.trackedItem.deleteMany({
            where: { customerId: req.user.userId, itemId },
        });

        if (count === 0) {
            sendError(res, 404, 'Товар не найден в вашем списке');
            return;
        }

        sendSuccess(res, null, 200, 'Товар удалён из отслеживаемых');
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

/**
 * GET /api/customer/tracked/:itemId/history
 */
export async function customerGetItemHistory(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const { itemId } = req.params;
    if (!itemId) { sendError(res, 400, 'ID товара обязателен'); return; }

    try {
        const tracked = await prisma.trackedItem.findUnique({
            where: { customerId_itemId: { customerId: req.user.userId, itemId } },
            include: {
                item: {
                    select: {
                        id: true,
                        trackingCode: true,
                        title: true,
                        description: true,
                        currentStatus: true,
                        createdAt: true,
                        updatedAt: true,
                        fromCity: true,        // ← добавить
                        toCity: true,          // ← добавить
                        recipientName: true,   // ← добавить
                        recipientPhone: true,  // ← добавить
                        weight: true,          // ← добавить
                        cashOnDelivery: true,  // ← добавить
                        comment: true,         // ← добавить
                        statusHistory: {
                            orderBy: { changedAt: 'asc' },
                            select: {
                                id: true,
                                oldStatus: true,
                                newStatus: true,
                                changedAt: true,
                                location: true,    // ← добавить
                            },
                        },
                    },
                },
            },
        });

        if (!tracked) { sendError(res, 404, 'Товар не найден в вашем списке'); return; }
        sendSuccess(res, { addedAt: tracked.addedAt, ...tracked.item });
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}