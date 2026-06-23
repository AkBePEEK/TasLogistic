import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import {prisma, PrismaTx} from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { UpdateStatusInput } from '../schemas';
import {generateTrackingCode} from "../utils/generateTrackingCode";
import { io } from '../socket';

/**
 * PATCH /api/seller/items/:id/status
 * Продавец может менять статус только своего товара.
 * Каждое изменение создаёт запись в StatusHistory (транзакция).
 */
export async function sellerUpdateStatus(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const { id } = req.params;
    const { status, location }: UpdateStatusInput = req.body;
    const userId = req.user.userId; // ← из auth middleware

    if (!id) { sendError(res, 400, 'ID товара обязателен'); return; }

    try {
        const result = await prisma.$transaction(async (tx: PrismaTx) => {
            const item = await tx.item.findUnique({
                where: { id },
                select: { id: true, currentStatus: true, sellerId: true, trackingCode: true },
            });

            if (!item) return null;
            if (item.currentStatus === status) throw new Error('STATUS_SAME');

            const updatedItem = await tx.item.update({
                where: { id },
                data: { currentStatus: status },
            });

            await tx.statusHistory.create({
                data: {
                    itemId: id,
                    oldStatus: item.currentStatus,
                    newStatus: status,
                    changedBy: userId,
                    location: location ?? null,
                },
            });

            return { updatedItem, trackingCode: item.trackingCode };
        });

        if (!result) { sendError(res, 404, 'Товар не найден'); return; }

        const { updatedItem, trackingCode } = result;

        // 📡 Отправляем события через Socket.IO
        // 1. Всем, кто отслеживает этот трек-код (покупатели)
        io.to(`track:${trackingCode}`).emit('statusUpdated', {
            trackingCode,
            newStatus: status,
            location,
            updatedAt: new Date().toISOString(),
        });

        // 2. Админам (для дашборда)
        io.to('admin').emit('adminStatusUpdate', {
            itemId: id,
            trackingCode,
            newStatus: status,
            updatedBy: userId,
            timestamp: new Date().toISOString(),
        });

        sendSuccess(res, updatedItem, 200, 'Статус успешно обновлён');
    } catch (err) {
        if (err instanceof Error && err.message === 'STATUS_SAME') {
            sendError(res, 400, 'Товар уже имеет указанный статус'); return;
        }
        console.error('[sellerUpdateStatus]', err);
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

/**
 * GET /api/seller/items
 * Возвращает постраничный список товаров текущего продавца.
 */
export async function sellerGetItems(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    // Начало текущего месяца
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    try {
        const [items, total, monthlyCount] = await prisma.$transaction([
            prisma.item.findMany({
                where: { sellerId: req.user.userId },
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    statusHistory: {
                        orderBy: { changedAt: 'desc' },
                        take: 1,
                    },
                },
            }),
            prisma.item.count({ where: { sellerId: req.user.userId } }),
            // ← количество товаров созданных за текущий месяц
            prisma.item.count({
                where: {
                    sellerId: req.user.userId,
                    createdAt: { gte: startOfMonth },
                },
            }),
        ]);

        sendSuccess(res, { items, total, page, limit, monthlyCount });
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

/**
 * GET /api/seller/items/:id
 * Детальная информация о товаре с полной историей статусов
 */
export async function sellerGetItemById(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const { id } = req.params;

    if (!id) {
        sendError(res, 400, 'ID товара обязателен');
        return;
    }

    try {
        const item = await prisma.item.findUnique({
            where: { id },
            include: {
                statusHistory: {
                    orderBy: { changedAt: 'asc' },
                    select: {
                        id: true,
                        oldStatus: true,
                        newStatus: true,
                        changedAt: true,
                    },
                },
            },
        });

        if (!item) {
            sendError(res, 404, 'Товар не найден');
            return;
        }

        // Проверяем ownership — продавец видит только свои товары
        if (item.sellerId !== req.user.userId) {
            sendError(res, 404, 'Товар не найден');
            return;
        }

        sendSuccess(res, item);
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

/**
 * POST /api/seller/items
 * Продавец создаёт новый товар. trackingCode должен быть уникальным.
 */
export async function sellerCreateItem(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const {
        title, description,
        recipientName, recipientPhone,
        senderName, senderPhone,
        fromCity, toCity,
        weight, itemsCount, cashOnDelivery, comment,
        operatorName,
        deliveryType,
    } = req.body;

    const sellerId = req.user.userId;
    if (!sellerId) { sendError(res, 401, 'Не авторизован'); return; }

    try {
        const trackingCode = await generateTrackingCode();

        const item = await prisma.$transaction(async (tx: PrismaTx) => {
            const created = await tx.item.create({
                data: {
                    trackingCode,
                    title,
                    description,
                    recipientName,
                    recipientPhone,
                    senderName,
                    senderPhone,
                    fromCity,
                    toCity,
                    weight,
                    itemsCount,
                    cashOnDelivery,
                    comment,
                    operatorName,
                    deliveryType,
                    sellerId,
                },
            });

            await tx.statusHistory.create({
                data: {
                    itemId: created.id,
                    oldStatus: 'CREATED',
                    newStatus: 'CREATED',
                    changedBy: sellerId,
                    location: fromCity, // ← начальная локация
                },
            });

            return created;
        });

        sendSuccess(res, item, 201, `Товар создан. Трек-код: ${item.trackingCode}`);
    } catch (err) {
        if (err instanceof Error && err.message.includes('уникальный трек-код')) {
            sendError(res, 500, err.message); return;
        }
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}