import { Router } from 'express';
import {register, login, logout, me, refresh, requestPhoneOtp, verifyPhoneOtp} from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { RegisterSchema, LoginSchema } from '../schemas';
import rateLimit from 'express-rate-limit';
import {otpRequestLimit} from "../middleware/otpRateLimit";

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });

const router = Router();
router.post('/register', authLimiter, validate(RegisterSchema), register);
router.post('/login', authLimiter, validate(LoginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', me);
/*
router.post('/login/phone/request', otpRequestLimit, requestPhoneOtp);
router.post('/login/phone/verify', otpRequestLimit, verifyPhoneOtp);
*/
export default router;