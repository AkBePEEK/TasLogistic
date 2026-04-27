import { Request, Response } from 'express';
import * as argon2 from 'argon2';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { RegisterInput, LoginInput } from '../schemas';
import { JwtPayload, Role } from '../types';
import { generateRefreshToken, signAccessToken, verifyAccessToken } from '../utils/tokens';
import { CookieOptions } from 'express';

const isProd = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000,
};

const REFRESH_COOKIE: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
};

const REFRESH_TOKEN_TTL_DAYS = 30;

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

        res.cookie('accessToken', accessToken, ACCESS_COOKIE);
        res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE);

        sendSuccess(res, {
            id: stored.user.id,
            email: stored.user.email,
            role: stored.user.role,
        });
    } catch {
        sendError(res, 500, 'Внутренняя ошибка сервера');
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

    res.cookie('accessToken', accessToken, ACCESS_COOKIE);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE);
}