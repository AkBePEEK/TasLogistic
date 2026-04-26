import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    const password = await argon2.hash('Admin123');

    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: { email: 'admin@example.com', password, role: 'ADMIN' },
    });

    const seller = await prisma.user.upsert({
        where: { email: 'seller@example.com' },
        update: {},
        create: { email: 'seller@example.com', password, role: 'SELLER' },
    });

    const customer = await prisma.user.upsert({
        where: { email: 'customer@example.com' },
        update: {},
        create: { email: 'customer@example.com', password, role: 'CUSTOMER' },
    });

    const item = await prisma.item.upsert({
        where: { trackingCode: 'TRK-000001' },
        update: {},
        create: {
            trackingCode: 'TRK-000001',
            title: 'Тестовый товар',
            sellerId: seller.id,
            currentStatus: 'PROCESSING',
        },
    });

    await prisma.statusHistory.createMany({
        data: [
            {
                itemId: item.id,
                oldStatus: 'CREATED',
                newStatus: 'CREATED',
                changedBy: seller.id,
            },
            {
                itemId: item.id,
                oldStatus: 'CREATED',
                newStatus: 'PROCESSING',
                changedBy: seller.id,
            },
        ],
        skipDuplicates: true,
    });

    console.log('Seed completed:', {
        admin: admin.email,
        seller: seller.email,
        customer: customer.email,
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());