import rateLimit from 'express-rate-limit';

export const otpRequestLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 5, // 5 запросов на IP+телефон
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `${req.ip}:${req.body.phone || 'unknown'}`,
    message: { success: false, message: 'Слишком много попыток. Подождите 15 минут.' },
});