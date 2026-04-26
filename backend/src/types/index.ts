import { Request } from 'express';

export type Role = 'SELLER' | 'ADMIN' | 'CUSTOMER';

export interface JwtPayload {
    userId: string;
    email: string;
    role: Role;
    iat: number;
    exp: number;
}

// Расширяем Request, чтобы прокидывать user через middleware
export interface AuthenticatedRequest extends Request {
    user: JwtPayload;
}

export interface ApiResponse<T = undefined> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: unknown[];  // остаётся как есть
}