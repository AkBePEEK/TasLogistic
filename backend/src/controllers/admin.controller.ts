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

    try {
        const where = search
            ? {
                OR: [
                    { trackingCode: { contains: search, mode: 'insensitive' as const } },
                    { title: { contains: search, mode: 'insensitive' as const } },
                    { recipientName: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : {};

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