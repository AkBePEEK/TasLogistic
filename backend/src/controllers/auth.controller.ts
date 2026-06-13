import { Request, Response } from 'express';
import * as argon2 from 'argon2';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { normalizePhone } from '../utils/phone';
import { generateOtp } from '../utils/otp';
import { RegisterInput, LoginInput } from '../schemas';
import { JwtPayload } from '../types';
import { generateRefreshToken, signAccessToken, verifyAccessToken } from '../utils/tokens';
import { CookieOptions } from 'express';
import {z} from "zod";
import crypto from 'crypto';
import jwt from "jsonwebtoken";
import { Role } from '@prisma/client';

const isProd = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 15 * 60 * 1000,
    domain: isProd ? undefined : undefined,
};

const REFRESH_COOKIE: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
    domain: isProd ? undefined : undefined,
};

const REFRESH_TOKEN_TTL_DAYS = 30;

// Схемы валидации
const phoneSchema = z.object({
    phone: z.string().min(10, 'Введите номер телефона')
});

const verifySchema = z.object({
    phone: z.string().min(10),
    code: z.string().length(6, 'Код должен содержать 6 цифр')
});

export async function me(req: Request, res: Response): Promise<void> {
    const token: string | undefined = req.cookies?.accessToken;

    if (!token) {
        sendError(res, 401, 'Не авторизован');
        return;
    }

    try {
        const payload = verifyAccessToken(token) as JwtPayload;
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, role: true },
        });

        if (!user) {
            sendError(res, 401, 'Пользователь не найден');
            return;
        }

        sendSuccess(res, {
            id: user.id,
            email: user.email,
            role: user.role as Role,
        });
    } catch {
        sendError(res, 401, 'Токен недействителен');
    }
}

export async function register(req: Request, res: Response): Promise<void> {
    const { email, password, role }: RegisterInput = req.body;

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            sendError(res, 400, 'Email уже используется');
            return;
        }

        const hashed = await argon2.hash(password);
        const user = await prisma.user.create({
            data: { email, password: hashed, role },
            select: { id: true, email: true, role: true },
        });

        await setAuthCookies(res, user.id, user.email, user.role as Role);
        sendSuccess(res, { id: user.id, email: user.email, role: user.role }, 201);
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

export async function login(req: Request, res: Response): Promise<void> {
    const { email, password }: LoginInput = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            sendError(res, 401, 'Неверный email или пароль');
            return;
        }

        const valid = await argon2.verify(user.password, password);
        if (!valid) {
            sendError(res, 401, 'Неверный email или пароль');
            return;
        }

        await setAuthCookies(res, user.id, user.email, user.role as Role);
        sendSuccess(res, { id: user.id, email: user.email, role: user.role });
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

export async function logout(req: Request, res: Response): Promise<void> {
    const refreshToken: string | undefined = req.cookies?.refreshToken;

    if (refreshToken) {
        await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/api/auth' });
    sendSuccess(res, null, 200, 'Выход выполнен');
}

export async function refresh(req: Request, res: Response): Promise<void> {
    const refreshToken: string | undefined = req.cookies?.refreshToken;

    if (!refreshToken) {
        sendError(res, 401, 'Refresh token отсутствует');
        return;
    }

    try {
        const stored = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: {
                user: { select: { id: true, email: true, role: true } },
            },
        });

        if (!stored) {
            sendError(res, 401, 'Refresh token недействителен');
            return;
        }

        if (stored.expiresAt < new Date()) {
            await prisma.refreshToken.delete({ where: { token: refreshToken } });
            sendError(res, 401, 'Refresh token истёк');
            return;
        }

        const newRefreshToken = generateRefreshToken();

        await prisma.$transaction([
            prisma.refreshToken.delete({ where: { token: refreshToken } }),
            prisma.refreshToken.create({
                data: {
                    userId: stored.userId,
                    token: newRefreshToken,
                    expiresAt: new Date(
                        Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
                    ),
                },
            }),
        ]);

        const accessToken = signAccessToken({
            userId: stored.user.id,
            email: stored.user.email,
            role: stored.user.role as Role,
        });

        res.cookie('accessToken', accessToken, domain: '.taslogistic.kz', ACCESS_COOKIE);
        res.cookie('refreshToken', newRefreshToken, domain: '.taslogistic.kz', REFRESH_COOKIE);

        sendSuccess(res, {
            id: stored.user.id,
            email: stored.user.email,
            role: stored.user.role,
        });
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
    }
}

// 🔹 POST /api/auth/login/phone/request
export async function requestPhoneOtp(req: Request, res: Response) {
    try {
        const { phone } = phoneSchema.parse(req.body);
        const normalized = normalizePhone(phone);

        const code = generateOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Удаляем старые OTP и создаём новый
        await prisma.$transaction(async (tx) => {
            await tx.otp.deleteMany({ where: { phone: normalized } });
            await tx.otp.create({
                data: { phone: normalized, code, expiresAt }
            });
        });

        // DEV: логирование, PROD: отправка через SMS провайдера
        console.log(`[DEV] OTP для ${normalized}: ${code}`);

        sendSuccess(res, null, 200, 'Код отправлен');
    } catch (err) {
        if (err instanceof z.ZodError) {
            return sendError(res, 400, 'Неверный формат телефона');
        }
        if (err instanceof Error && err.message === 'INVALID_PHONE_FORMAT') {
            return sendError(res, 400, 'Неверный формат телефона');
        }
        console.error('[requestPhoneOtp]', err);
        sendError(res, 500, 'Ошибка отправки кода');
    }
}

// 🔹 POST /api/auth/login/phone/verify
export async function verifyPhoneOtp(req: Request, res: Response) {
    try {
        const { phone, code } = verifySchema.parse(req.body);
        const normalized = normalizePhone(phone);

        // Поиск валидного OTP
        const otp = await prisma.otp.findFirst({
            where: {
                phone: normalized,
                code,
                expiresAt: { gt: new Date() }
            },
        });

        if (!otp) {
            return sendError(res, 400, 'Неверный или истёкший код');
        }

        // Поиск или создание пользователя
        let user = await prisma.user.findUnique({
            where: { phone: normalized }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    phone: normalized,
                    phoneVerified: true,
                    role: Role.CUSTOMER,
                    email: `${normalized}@phone.taslogistic.kz`,
                    password: crypto.randomUUID(), // случайный пароль, вход только по OTP
                },
            });
        } else {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { phoneVerified: true },
            });
        }

        // Генерация JWT (используй свои функции)
        const accessToken = jwt.sign(
            { userId: user.id, role: user.role, email: user.email },
            process.env.JWT_SECRET!,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: '30d' }
        );

        // Сохранение refresh token в БД
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        // Установка cookies
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'none',
            maxAge: 15 * 60 * 1000,
            path: '/',
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'none',
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: '/api/auth',
        });

        // Удаление OTP
        await prisma.otp.delete({ where: { id: otp.id } });

        sendSuccess(res, {
            id: user.id,
            role: user.role,
            phone: user.phone,
            email: user.email
        }, 200, 'Успешный вход');

    } catch (err) {
        if (err instanceof z.ZodError) {
            return sendError(res, 400, 'Ошибка валидации');
        }
        console.error('[verifyPhoneOtp]', err);
        sendError(res, 500, 'Ошибка верификации');
    }
}

async function setAuthCookies(
    res: Response,
    userId: string,
    email: string,
    role: Role
): Promise<void> {
    const accessToken = signAccessToken({ userId: userId, email, role });
    const refreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
        data: {
            userId,
            token: refreshToken,
            expiresAt: new Date(
                Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
            ),
        },
    });

    console.log('Setting cookies:', {
        accessToken: accessToken.substring(0, 20),
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
    });

    res.cookie('accessToken', accessToken, ACCESS_COOKIE);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE);
}
