import { Router, RequestHandler } from 'express';
import { authenticateToken } from '../middleware/authenticateToken';
import {
    getProfile,
    updateEmail,
    updatePassword,
} from '../controllers/profile.controller';

const router = Router();

router.use(authenticateToken as RequestHandler);

router.get('/', getProfile as unknown as RequestHandler);
router.patch('/email', updateEmail as unknown as RequestHandler);
router.patch('/password', updatePassword as unknown as RequestHandler);

export default router;