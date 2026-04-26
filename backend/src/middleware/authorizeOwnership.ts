import { Response, NextFunction, RequestHandler } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/prisma';
import { sendError } from '../utils/response';

async function authorizeOwnershipHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    const { id } = req.params;

    if (!id) {
        sendError(res, 400, 'ID товара обязателен');
        return;
    }

    try {
        const item = await prisma.item.findUnique({
            where: { id },
            select: { sellerId: true },
        });

        if (!item) {
            sendError(res, 404, 'Товар не найден');
            return;
        }

        if (item.sellerId !== req.user.userId) {
            sendError(res, 404, 'Товар не найден');
            return;
        }

        next();
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

// Экспортируем уже приведённый тип — больше нигде не нужно делать as RequestHandler
export const authorizeOwnership =
    authorizeOwnershipHandler as unknown as RequestHandler;