import { Router, RequestHandler } from 'express';
import { authenticateToken } from '../middleware/authenticateToken';
import { authorizeRole } from '../middleware/authorizeRole';
import { validate } from '../middleware/validate';
import { UpdateStatusSchema } from '../schemas';
import {adminDeleteItem, adminGetItems, adminGetReports, adminUpdateStatus} from '../controllers/admin.controller';

const router = Router();

router.use(
    authenticateToken as RequestHandler,
    authorizeRole('ADMIN') as RequestHandler
);

router.get('/reports', adminGetReports as unknown as RequestHandler);
router.get('/items', adminGetItems as unknown as RequestHandler);
router.patch('/items:id/status', validate(UpdateStatusSchema), adminUpdateStatus as unknown as RequestHandler);
router.delete('/items:id', adminDeleteItem as unknown as RequestHandler);

export default router;