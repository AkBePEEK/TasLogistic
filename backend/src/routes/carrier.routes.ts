import { Router, RequestHandler } from 'express';
import { authenticateToken } from '../middleware/authenticateToken';
import { authorizeRole } from '../middleware/authorizeRole';
import {
    getCarriers,
    createCarrier,
    updateCarrier,
    deleteCarrier,
} from '../controllers/carrier.controller';

const router = Router();

// Публичный — получить перевозчиков по городу
router.get('/', getCarriers);

// Создать/редактировать — ADMIN и SELLER
router.post(
    '/',
    authenticateToken as RequestHandler,
    authorizeRole('ADMIN', 'SELLER') as RequestHandler,
    createCarrier as unknown as RequestHandler
);

router.patch(
    '/:id',
    authenticateToken as RequestHandler,
    authorizeRole('ADMIN', 'SELLER') as RequestHandler,
    updateCarrier as unknown as RequestHandler
);

// Удалить — только ADMIN
router.delete(
    '/:id',
    authenticateToken as RequestHandler,
    authorizeRole('ADMIN') as RequestHandler,
    deleteCarrier as unknown as RequestHandler
);

export default router;