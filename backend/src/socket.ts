import {Server} from 'socket.io';
import {parse} from 'cookie';
import jwt from 'jsonwebtoken';
import {JwtPayload} from './types'; // твой тип { userId: string; role: string }

export let io: Server; // ← экспортируем для использования в контроллерах

export const initSocket = (server: any) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL, // https://taslogistic.kz
            credentials: true,
        },
    });

    // Middleware: аутентификация через httpOnly cookie
    io.use((socket, next) => {
        const cookieHeader = socket.handshake.headers.cookie;
        if (!cookieHeader) return next(new Error('No cookie'));

        const cookies = parse(cookieHeader);
        const token = cookies.accessToken;

        if (!token) return next(new Error('No accessToken'));

        try {
            socket.data.user = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload; // { userId, role, email }
            next();
        } catch (err) {
            return next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const { userId, role } = socket.data.user;

        // Подписка на личные уведомления
        socket.join(`user:${userId}`);

        // Ролевые комнаты
        if (role === 'ADMIN') socket.join('admin');
        if (role === 'SELLER') socket.join('seller');
        if (role === 'COURIER') socket.join('courier');

        // CUSTOMER может подписаться на конкретный трек-код
        socket.on('subscribe:tracking', (trackingCode: string) => {
            socket.join(`track:${trackingCode}`);
        });

        socket.on('disconnect', () => {
            // cleanup при необходимости
        });
    });

    return io;
};