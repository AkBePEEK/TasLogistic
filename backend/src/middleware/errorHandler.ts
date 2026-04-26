import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import { sendError } from '../utils/response';

const logger = pino({ name: 'errorHandler' });

export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    logger.error({ err }, 'Unhandled error');
    sendError(res, 500, 'Внутренняя ошибка сервера');
}