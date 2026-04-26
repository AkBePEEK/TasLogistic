import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import pino, {LoggerOptions} from 'pino';
import pinoHttp from 'pino-http';

import authRoutes from './routes/auth.routes';
import trackRoutes from './routes/track.routes';
import sellerRoutes from './routes/seller.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middleware/errorHandler';
import customerRoutes from "./routes/customer.routes";
import profileRoutes from "./routes/profile.routes";

const isProd = process.env.NODE_ENV === 'production';

const loggerOptions: LoggerOptions = isProd
    ? { level: 'info' }
    : {
        level: 'debug',
    };

const logger = pino(loggerOptions);

export function createApp() {
    const app = express();

    // Security headers
    app.use(helmet());

    // CORS — только доверенные origins
    app.use(
        cors({
            origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
            credentials: true, // обязательно для передачи cookies
            methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        })
    );

    app.use(express.json({ limit: '10kb' }));
    app.use(cookieParser());
    app.use(pinoHttp({ logger }));

    // Маршруты
    app.use('/api/auth', authRoutes);
    app.use('/api/track', trackRoutes);
    app.use('/api/seller/items', sellerRoutes);
    app.use('/api/admin/items', adminRoutes);
    app.use('/api/customer', customerRoutes);
    app.use('/api/profile', profileRoutes);

    // Централизованный обработчик ошибок — всегда последний
    app.use(errorHandler);

    return app;
}

// Точка входа
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT ?? 3001;
    createApp().listen(PORT, () => {
        logger.info({ port: PORT, env: process.env.NODE_ENV }, 'Server started');
    });
}