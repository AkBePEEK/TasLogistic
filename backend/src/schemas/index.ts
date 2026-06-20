import { z } from 'zod';

const StatusEnum = z.enum([
    'CREATED',
    'PROCESSING',
    'SHIPPED',
    'IN_TRANSIT',
    'DELIVERED',
    'CANCELLED',
]);

const DeliveryTypeEnum = z.enum(['AVIA', 'RAIL', 'TRUCK']);

export const RegisterSchema = z.object({
    email: z.string().email('Некорректный email'),
    password: z
        .string()
        .min(8, 'Минимум 8 символов'),
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
    senderName: z.string().min(2).max(255),
    senderPhone: z.string().min(10).max(20),
    fromCity: z.string().min(2).max(100).default('Алматы'),
    toCity: z.string().min(2).max(100),
    weight: z.number().positive().max(10000),
    itemsCount: z.number().int().positive().max(10000).default(1),
    cashOnDelivery: z.number().min(0).optional(),
    comment: z.string().max(500).optional(),
    deliveryType: DeliveryTypeEnum.default('TRUCK'),
});

export const UpdateStatusSchema = z.object({
    status: StatusEnum,
    location: z.string().max(255).optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;