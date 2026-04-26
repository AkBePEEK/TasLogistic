import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(
    res: Response,
    data: T,
    statusCode = 200,
    message?: string
): void {
    // Собираем объект без undefined-полей — exactOptionalPropertyTypes требует
    // чтобы опциональные поля либо присутствовали со значением, либо отсутствовали
    const body: ApiResponse<T> = { success: true, data };
    if (message !== undefined) body.message = message;
    res.status(statusCode).json(body);
}

export function sendError(
    res: Response,
    statusCode: number,
    message: string,
    errors?: unknown[]
): void {
    const body: ApiResponse = { success: false, message };
    // Добавляем поле только если оно реально передано — не undefined
    if (errors !== undefined) body.errors = errors;
    res.status(statusCode).json(body);
}