import { Router, RequestHandler } from 'express';
import { authenticateToken } from '../middleware/authenticateToken';
import { authorizeRole } from '../middleware/authorizeRole';
import { validate } from '../middleware/validate';
import { UpdateStatusSchema } from '../schemas';
import { adminGetItems, adminUpdateStatus } from '../controllers/admin.controller';

const router = Router();

router.use(
    authenticateToken as RequestHandler,
    authorizeRole('ADMIN') as RequestHandler
);

router.get('/', adminGetItems as unknown as RequestHandler);
router.patch('/:id/status', validate(UpdateStatusSchema), adminUpdateStatus as unknown as RequestHandler);

export default router;