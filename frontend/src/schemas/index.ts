import { z } from 'zod';

const CITIES = [
    'Алматы', 'Астана', 'Шымкент', 'Қарағанды', 'Ақтобе',
    'Тараз', 'Павлодар', 'Өскемен', 'Семей', 'Атырау',
    'Қостанай', 'Орал', 'Петропавл', 'Түркістан', 'Көкшетау',
    'Талдықорған', 'Екібастұз', 'Теміртау', 'Жанаозен', 'Рудный',
] as const;

export const CreateItemSchema = z.object({
    title: z.string().min(2, 'Минимум 2 символа').max(255),
    recipientName: z.string().min(2, 'Введите ФИО получателя').max(255),
    recipientPhone: z.string().min(10, 'Введите корректный номер').max(20),
    fromCity: z.enum(CITIES, { errorMap: () => ({ message: 'Выберите город' }) }),
    toCity: z.enum(CITIES, { errorMap: () => ({ message: 'Выберите город' }) }),
    weight: z.coerce.number().positive('Введите вес').max(10000),
    cashOnDelivery: z.coerce.number().min(0).optional(),
    comment: z.string().max(500).optional(),
});

export const CITY_LIST = CITIES;

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
