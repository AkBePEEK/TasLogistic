import {NextFunction, Response} from 'express';
import {AuthenticatedRequest} from '../types';
import {sendError} from '../utils/response';
import {verifyAccessToken} from "../utils/tokens";

/**
 * Читает JWT из httpOnly cookie `token`.
 * При успехе добавляет `req.user` для последующих middleware.
 */
export function authenticateToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void {
    const token: string | undefined = req.cookies?.accessToken;

    if (!token) {
        sendError(res, 401, 'Аутентификация обязательна');
        return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        // Конфигурационная ошибка — не должна попасть в prod
        sendError(res, 500, 'Ошибка конфигурации сервера');
        return;
    }

    try {
        req.user = verifyAccessToken(token);
        next();
    } catch {
        sendError(res, 401, 'Токен недействителен или истёк');
    }
}