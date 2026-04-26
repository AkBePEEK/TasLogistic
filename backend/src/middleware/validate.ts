import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/response';

/**
 * Фабрика middleware для валидации тела запроса через Zod-схему.
 * При ошибке возвращает 400 с детальными полями.
 */
export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            sendError(res, 400, 'Ошибка валидации', result.error.errors);
            return;
        }
        // Перезаписываем body распарсенными и очищенными данными
        req.body = result.data;
        next();
    };
}