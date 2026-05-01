import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

export const useSocket = (trackingCode?: string | null) => {
    const socketRef = useRef<Socket>();
    const qc = useQueryClient();

    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_API_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
        });

        const socket = socketRef.current;

        // Подписка на трек-код, если передан
        if (trackingCode) {
            socket.emit('subscribe:tracking', trackingCode);
        }

        socket.on('statusUpdated', (payload) => {
            // Инвалидируем кэш трекинга
            void qc.invalidateQueries({ queryKey: ['publicTrack', payload.trackingCode] });
            void qc.invalidateQueries({ queryKey: ['customerTrackedItems'] });
        });

        socket.on('adminStatusUpdate', () => {
            void qc.invalidateQueries({ queryKey: ['adminItems'] });
        });

        return () => {
            socket.disconnect();
        };
    }, [trackingCode, qc]);

    return socketRef.current;
};