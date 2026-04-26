import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendError } from '../utils/response';

// Берём тип Role из наших собственных типов, не из @prisma/client
type Role = 'SELLER' | 'ADMIN' | 'CUSTOMER';

export function authorizeRole(...roles: Role[]) {
    return (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): void => {
        if (!roles.includes(req.user.role as Role)) {
            sendError(res, 403, 'Недостаточно прав для выполнения операции');
            return;
        }
        next();
    };
}