import { Router } from 'express';
import { trackItem } from '../controllers/track.controller';
import rateLimit from 'express-rate-limit';

const trackLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30 });

const router = Router();
router.get('/:code', trackLimiter, trackItem);
export default router;