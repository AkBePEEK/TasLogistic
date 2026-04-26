import { Router, RequestHandler } from 'express';
import { authenticateToken } from '../middleware/authenticateToken';
import { authorizeRole } from '../middleware/authorizeRole';
import { authorizeOwnership } from '../middleware/authorizeOwnership';
import { validate } from '../middleware/validate';
import { CreateItemSchema, UpdateStatusSchema } from '../schemas';
import {
    sellerGetItems,
    sellerCreateItem,
    sellerUpdateStatus, sellerGetItemById,
} from '../controllers/seller.controller';

const router = Router();

router.use(
    authenticateToken as RequestHandler,
    authorizeRole('SELLER') as RequestHandler
);

router.get('/', sellerGetItems as unknown as RequestHandler);
router.post('/', validate(CreateItemSchema), sellerCreateItem as unknown as RequestHandler);
router.get('/:id', sellerGetItemById as unknown as RequestHandler);
router.patch(
    '/:id/status',
    authorizeOwnership,                                              // ← просто без as
    validate(UpdateStatusSchema),
    sellerUpdateStatus as unknown as RequestHandler
);

export default router;