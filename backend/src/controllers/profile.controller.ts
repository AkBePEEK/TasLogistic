import { Response } from 'express';
import { z } from 'zod';
import * as argon2 from 'argon2';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

const UpdateEmailSchema = z.object({
    email: z.string().email('Некорректный email'),
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
});

const UpdatePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: z
        .string()
        .min(8, 'Минимум 8 символов')
        .regex(/[A-Z]/, 'Нужна заглавная буква')
        .regex(/[0-9]/, 'Нужна цифра'),
});

/**
 * GET /api/profile
 * Получить данные текущего пользователя
 */
export async function getProfile(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, email: true, role: true, createdAt: true },
        });

        if (!user) {
            sendError(res, 404, 'Пользователь не найден');
            return;
        }

        sendSuccess(res, user);
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

/**
 * PATCH /api/profile/email
 * Сменить email — требует подтверждения паролем
 */
export async function updateEmail(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const result = UpdateEmailSchema.safeParse(req.body);
    if (!result.success) {
        sendError(res, 400, 'Ошибка валидации', result.error.errors);
        return;
    }

    const { email, currentPassword } = result.data;

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
        });

        if (!user) {
            sendError(res, 404, 'Пользователь не найден');
            return;
        }

        // Проверяем текущий пароль
        const valid = await argon2.verify(user.password, currentPassword);
        if (!valid) {
            sendError(res, 401, 'Неверный текущий пароль');
            return;
        }

        // Проверяем что email не занят
        if (email !== user.email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                sendError(res, 400, 'Email уже используется');
                return;
            }
        }

        const updated = await prisma.user.update({
            where: { id: req.user.userId },
            data: { email },
            select: { id: true, email: true, role: true },
        });

        sendSuccess(res, updated, 200, 'Email успешно обновлён');
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

/**
 * PATCH /api/profile/password
 * Сменить пароль
 */
export async function updatePassword(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const result = UpdatePasswordSchema.safeParse(req.body);
    if (!result.success) {
        sendError(res, 400, 'Ошибка валидации', result.error.errors);
        return;
    }

    const { currentPassword, newPassword } = result.data;

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
        });

        if (!user) {
            sendError(res, 404, 'Пользователь не найден');
            return;
        }

        const valid = await argon2.verify(user.password, currentPassword);
        if (!valid) {
            sendError(res, 401, 'Неверный текущий пароль');
            return;
        }

        if (currentPassword === newPassword) {
            sendError(res, 400, 'Новый пароль должен отличаться от текущего');
            return;
        }

        const hashed = await argon2.hash(newPassword);
        await prisma.user.update({
            where: { id: req.user.userId },
            data: { password: hashed },
        });

        // Инвалидируем все refresh токены — принудительный выход со всех устройств
        await prisma.refreshToken.deleteMany({
            where: { userId: req.user.userId },
        });

        sendSuccess(res, null, 200, 'Пароль успешно изменён. Войдите заново.');
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}