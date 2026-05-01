import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma, PrismaTx } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { UpdateStatusInput } from '../schemas';

export async function adminGetItems(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const fromCity = typeof req.query.fromCity === 'string' ? req.query.fromCity : undefined;
    const toCity = typeof req.query.toCity === 'string' ? req.query.toCity : undefined;
    const dateFrom = typeof req.query.dateFrom === 'string' ? req.query.dateFrom : undefined;
    const dateTo = typeof req.query.dateTo === 'string' ? req.query.dateTo : undefined;

    try {
        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { trackingCode: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { recipientName: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status) where.currentStatus = status;
        if (fromCity) where.fromCity = { contains: fromCity, mode: 'insensitive' };
        if (toCity) where.toCity = { contains: toCity, mode: 'insensitive' };

        if (dateFrom || dateTo) {
            where.createdAt = {
                ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                ...(dateTo ? { lte: new Date(dateTo) } : {}),
            };
        }

        const [items, total] = await prisma.$transaction([
            prisma.item.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    trackingCode: true,
                    title: true,
                    currentStatus: true,
                    createdAt: true,
                    updatedAt: true,
                    fromCity: true,
                    toCity: true,
                    recipientName: true,
                    cashOnDelivery: true,
                    seller: { select: { email: true } },
                },
            }),
            prisma.item.count({ where }),
        ]);

        sendSuccess(res, { items, total, page, limit });
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

export async function adminUpdateStatus(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const { id } = req.params;
    const { status }: UpdateStatusInput = req.body;

    // Проверяем до транзакции — после этого id гарантированно string
    if (!id) {
        sendError(res, 400, 'ID товара обязателен');
        return;
    }

    try {
        const result = await prisma.$transaction(async (tx: PrismaTx) => {
            const item = await tx.item.findUnique({
                where: { id },           // ← id: string ✓
                select: { currentStatus: true },
            });

            if (!item) return null;

            if (item.currentStatus === status) {
                throw new Error('STATUS_SAME');
            }

            const updated = await tx.item.update({
                where: { id },           // ← id: string ✓
                data: { currentStatus: status },
            });

            await tx.statusHistory.create({
                data: {
                    itemId: id,            // ← id: string ✓
                    oldStatus: item.currentStatus,
                    newStatus: status,
                    changedBy: req.user.userId,
                },
            });

            return updated;
        });

        if (!result) {
            sendError(res, 404, 'Товар не найден');
            return;
        }

        sendSuccess(res, result, 200, 'Статус обновлён администратором');
    } catch (err) {
        if (err instanceof Error && err.message === 'STATUS_SAME') {
            sendError(res, 400, 'Товар уже имеет указанный статус');
            return;
        }
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

/**
 * DELETE /api/admin/items/:id
 * Администратор удаляет товар полностью
 */
export async function adminDeleteItem(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const { id } = req.params;

    if (!id) {
        sendError(res, 400, 'ID товара обязателен');
        return;
    }

    try {
        // Удаляем в правильном порядке из-за foreign key constraints
        await prisma.$transaction([
            prisma.trackedItem.deleteMany({ where: { itemId: id } }),
            prisma.statusHistory.deleteMany({ where: { itemId: id } }),
            prisma.item.delete({ where: { id } }),
        ]);

        sendSuccess(res, null, 200, 'Товар удалён');
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

/**
 * GET /api/admin/reports
 * Отчёты: сумма, вес, количество по статусам, фильтр по периоду
 */
export async function adminGetReports(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const period = (req.query.period as string) ?? 'month';

    // Определяем дату начала периода
    const now = new Date();
    let dateFrom: Date;

    switch (period) {
        case 'today':
            dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            dateFrom = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    try {
        const items = await prisma.item.findMany({
            where: { createdAt: { gte: dateFrom } },
            select: {
                currentStatus: true,
                cashOnDelivery: true,
                weight: true,
                createdAt: true,
                fromCity: true,
                toCity: true,
            },
        });

        // Считаем статистику
        let totalAmount = 0;
        let totalWeight = 0;
        let deliveredAmount = 0;
        let deliveredWeight = 0;
        const statusCounts: Record<string, number> = {};
        const cityStats: Record<string, number> = {};

        for (const item of items) {
            // Суммы
            const amount = item.cashOnDelivery ?? 0;
            const weight = item.weight ?? 0;
            totalAmount += amount;
            totalWeight += weight;

            // По статусам
            statusCounts[item.currentStatus] =
                (statusCounts[item.currentStatus] ?? 0) + 1;

            // Доставленные
            if (item.currentStatus === 'DELIVERED') {
                deliveredAmount += amount;
                deliveredWeight += weight;
            }

            // Города назначения
            if (item.toCity) {
                cityStats[item.toCity] = (cityStats[item.toCity] ?? 0) + 1;
            }
        }

        // Топ 5 городов
        const topCities = Object.entries(cityStats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([city, count]) => ({ city, count }));

        sendSuccess(res, {
            period,
            dateFrom,
            total: items.length,
            totalAmount,
            totalWeight: Math.round(totalWeight * 100) / 100,
            deliveredAmount,
            deliveredWeight: Math.round(deliveredWeight * 100) / 100,
            statusCounts,
            topCities,
        });
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}