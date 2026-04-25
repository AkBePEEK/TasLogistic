import { z } from 'zod';
// @ts-ignore
import { Status } from '@prisma/client';

export const RegisterSchema = z.object({
    email: z.string().email('Некорректный email'),
    password: z
        .string()
        .min(8, 'Минимум 8 символов')
        .regex(/[A-Z]/, 'Должна быть хотя бы одна заглавная буква')
        .regex(/[0-9]/, 'Должна быть хотя бы одна цифра'),
    role: z.enum(['SELLER', 'ADMIN', 'CUSTOMER']),
});

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const CreateItemSchema = z.object({
    title: z.string().min(2).max(255),
    description: z.string().max(1000).optional(),
});

export const UpdateStatusSchema = z.object({
    status: z.nativeEnum(Status),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateItemInput = z.infer<typeof CreateItemSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;