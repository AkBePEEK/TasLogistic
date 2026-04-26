import { prisma } from '../config/prisma';

export async function generateTrackingCode(maxAttempts = 5): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const code = buildCode();
        const existing = await prisma.item.findUnique({
            where: { trackingCode: code },
            select: { id: true },
        });
        if (!existing) return code;
    }
    throw new Error('Не удалось сгенерировать уникальный трек-код. Попробуйте ещё раз.');
}

function buildCode(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const random = Array.from(
        { length: 8 },
        () => alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join('');
    return `TRK-${year}${month}-${random}`;
}