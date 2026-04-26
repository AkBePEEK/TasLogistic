import { PrismaClient, Prisma } from '@prisma/client';
import pino from 'pino';

const logger = pino({ name: 'prisma' });

// Singleton — важно для предотвращения утечек соединений в dev с hot-reload
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
        ],
    });

export type PrismaTx = Prisma.TransactionClient;

if (process.env.NODE_ENV !== 'production') {
    prisma.$on('query' as never, (e: { query: string; duration: number }) => {
        logger.debug({ query: e.query, duration: e.duration }, 'Prisma query');
    });
    globalForPrisma.prisma = prisma;
}