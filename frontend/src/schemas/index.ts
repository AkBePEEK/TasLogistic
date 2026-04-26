import { z } from 'zod';

const StatusEnum = z.enum([
    'CREATED',
    'PROCESSING',
    'SHIPPED',
    'IN_TRANSIT',
    'DELIVERED',
    'CANCELLED',
]);
z.object({
    email: z.string().email('Некорректный email'),
    password: z
        .string()
        .min(8, 'Минимум 8 символов')
        .regex(/[A-Z]/, 'Должна быть хотя бы одна заглавная буква')
        .regex(/[0-9]/, 'Должна быть хотя бы одна цифра'),
    role: z.enum(['SELLER', 'ADMIN', 'CUSTOMER']),
});
z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
z.object({
    title: z.string().min(2).max(255),
    description: z.string().max(1000).optional(),
});
z.object({
    status: StatusEnum,
});
