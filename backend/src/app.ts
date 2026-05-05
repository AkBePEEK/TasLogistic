import express from 'express';
import { createServer } from 'http';
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
import { initSocket } from './socket';
import carrierRoutes from './routes/carrier.routes';

const isProd = process.env.NODE_ENV === 'production';

// ← 1. Отдельная конфигурация для Production (без transport)
const prodLoggerOptions: LoggerOptions = {
    level: 'info',
};

// ← 2. Отдельная конфигурация для Development (с pino-pretty)
const devLoggerOptions: LoggerOptions = {
    level: 'debug',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname', // опционально: чище логи в деве
        },
    },
};

const loggerOptions: LoggerOptions = isProd ? prodLoggerOptions : devLoggerOptions;

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
    app.use(pinoHttp({
        logger,
        customSuccessMessage: (req, res) =>
            `${req.method} ${req.url} - ${res.statusCode}`,
    }));

    // Маршруты
    app.use('/api/auth', authRoutes);
    app.use('/api/track', trackRoutes);
    app.use('/api/seller/items', sellerRoutes);
    app.use('/api/admin/items', adminRoutes);
    app.use('/api/customer', customerRoutes);
    app.use('/api/profile', profileRoutes);
    app.use('/api/carriers', carrierRoutes);

    // Централизованный обработчик ошибок — всегда последний
    app.use(errorHandler);

    return app;
}

// Точка входа
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT ?? 3001;

    const app = createApp();

    // ← 4. Создаём HTTP-сервер на основе Express-приложения
    const httpServer = createServer(app);

    // ← 5. Инициализируем Socket.IO, передавая ему httpServer
    initSocket(httpServer);

    // ← 6. Слушаем httpServer, а не app
    httpServer.listen(PORT, () => {
        logger.info({ port: PORT, env: process.env.NODE_ENV }, '🚀 Server + WebSocket started');
    });

    // Graceful shutdown для WebSocket
    process.on('SIGTERM', () => {
        logger.info('SIGTERM received, shutting down gracefully');
        httpServer.close(() => {
            logger.info('Process terminated');
            process.exit(0);
        });
    });
}