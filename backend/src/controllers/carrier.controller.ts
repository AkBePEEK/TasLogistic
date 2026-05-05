import { Response, Request } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import {stripUndefined} from "../utils/strip-undefined";

const CarrierSchema = z.object({
    name: z.string().min(2).max(255),
    city: z.string().min(2).max(100),
    phone: z.string().min(7).max(20),
    type: z.enum(['AVIA', 'RAIL', 'TRUCK']),
});

/**
 * GET /api/carriers?city=Алматы
 * Публичный — возвращает перевозчиков по городу
 */
export async function getCarriers(req: Request, res: Response): Promise<void> {
    const city = typeof req.query.city === 'string' ? req.query.city : undefined;

    try {
        const carriers = await prisma.carrier.findMany({
            where: city ? { city: { contains: city, mode: 'insensitive' } } : {},
            orderBy: [{ city: 'asc' }, { type: 'asc' }],
        });
        sendSuccess(res, carriers);
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

/**
 * POST /api/carriers
 * Только ADMIN и SELLER
 */
export async function createCarrier(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const result = CarrierSchema.safeParse(req.body);
    if (!result.success) {
        sendError(res, 400, 'Ошибка валидации', result.error.errors);
        return;
    }

    try {
        const carrier = await prisma.carrier.create({ data: result.data });
        sendSuccess(res, carrier, 201, 'Перевозчик добавлен');
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

/**
 * PATCH /api/carriers/:id
 * Только ADMIN и SELLER
 */
export async function updateCarrier(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const { id } = req.params;
    if (!id) { sendError(res, 400, 'ID обязателен'); return; }

    const result = CarrierSchema.partial().safeParse(req.body);
    if (!result.success) {
        sendError(res, 400, 'Ошибка валидации', result.error.errors);
        return;
    }

    try {
        const carrier = await prisma.carrier.update({
            where: { id },
            data: stripUndefined(result.data),
        });
        sendSuccess(res, carrier, 200, 'Перевозчик обновлён');
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

/**
 * DELETE /api/carriers/:id
 * Только ADMIN
 */
export async function deleteCarrier(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const { id } = req.params;
    if (!id) { sendError(res, 400, 'ID обязателен'); return; }

    try {
        await prisma.carrier.delete({ where: { id } });
        sendSuccess(res, null, 200, 'Перевозчик удалён');
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}