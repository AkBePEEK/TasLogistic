import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JwtPayload } from '../types';

/**
 * Access token — короткоживущий (15 минут)
 * Содержит userId, email, role для авторизации запросов
 */
export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    const secret = process.env.JWT_SECRET!;
    return jwt.sign(
        { userId: payload.userId, email: payload.email, role: payload.role },
        secret,
        { expiresIn: '15m' }
    );
}

/**
 * Refresh token — долгоживущий случайный токен
 * Хранится в БД, используется только для получения нового access token
 */
export function generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
}

export function verifyAccessToken(token: string): JwtPayload {
    const secret = process.env.JWT_SECRET!;
    return jwt.verify(token, secret) as JwtPayload;
}