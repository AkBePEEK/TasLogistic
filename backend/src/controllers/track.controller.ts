import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export async function trackItem(req: Request, res: Response): Promise<void> {
    const { code } = req.params;

    if (!code || code.length > 64) {
        sendError(res, 400, 'Некорректный трек-код');
        return;
    }

    try {
        const item = await prisma.item.findUnique({
            where: {trackingCode: code.toUpperCase()},
            select: {
                trackingCode: true,
                title: true,
                currentStatus: true,
                createdAt: true,
                updatedAt: true,
                statusHistory: {
                    orderBy: {changedAt: 'asc'},
                    select: {
                        oldStatus: true,
                        newStatus: true,
                        changedAt: true,
                    },
                },
            },
        });

        if (!item) {
            sendError(res, 404, 'Товар с указанным трек-кодом не найден');
            return;
        }

        sendSuccess(res, item);
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}