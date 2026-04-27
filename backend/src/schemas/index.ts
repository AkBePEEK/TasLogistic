import { z } from 'zod';

const StatusEnum = z.enum([
    'CREATED',
    'PROCESSING',
    'SHIPPED',
    'IN_TRANSIT',
    'DELIVERED',
    'CANCELLED',
]);

export const RegisterSchema = z.object({
    email: z.string().email('Некорректный email'),
    password: z
        .string()
        .min(8, 'Минимум 8 символов')
        .regex(/[A-Z]/, 'Должна быть хотя бы одна заглавная буква')
        .regex(/[0-9]/, 'Должна быть хотя бы одна цифра'),
    role: z.enum(['SELLER', 'CUSTOMER']),
});

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const CreateItemSchema = z.object({
    title: z.string().min(2).max(255),
    description: z.string().max(1000).optional(),
    recipientName: z.string().min(2).max(255),
    recipientPhone: z.string().min(10).max(20),
    fromCity: z.string().min(2).max(100),
    toCity: z.string().min(2).max(100),
    weight: z.number().positive().max(10000),
    cashOnDelivery: z.number().min(0).optional(),
    comment: z.string().max(500).optional(),
});

export const UpdateStatusSchema = z.object({
    status: StatusEnum,
    location: z.string().max(255).optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;