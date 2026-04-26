import { Router, RequestHandler } from 'express';
import { authenticateToken } from '../middleware/authenticateToken';
import { authorizeRole } from '../middleware/authorizeRole';
import {
    customerGetTrackedItems,
    customerAddTrackedItem,
    customerRemoveTrackedItem,
    customerGetItemHistory,
} from '../controllers/customer.controller';

const router = Router();

router.use(
    authenticateToken as RequestHandler,
    authorizeRole('CUSTOMER') as RequestHandler
);

router.get('/tracked', customerGetTrackedItems as unknown as RequestHandler);
router.post('/tracked', customerAddTrackedItem as unknown as RequestHandler);
router.delete('/tracked/:itemId', customerRemoveTrackedItem as unknown as RequestHandler);
router.get('/tracked/:itemId/history', customerGetItemHistory as unknown as RequestHandler);

export default router;