// noinspection SpellCheckingInspection

import { z } from 'zod';

const CITIES = [
    'Алматы', 'Астана', 'Шымкент', 'Қарағанды', 'Ақтобе',
    'Тараз', 'Павлодар', 'Өскемен', 'Семей', 'Атырау',
    'Қостанай', 'Орал', 'Петропавл', 'Түркістан', 'Көкшетау',
    'Талдықорған', 'Екібастұз', 'Теміртау', 'Жанаозен', 'Рудный',
] as const;
const TO_CITIES = [
    'Актау', "Атырау", "Актобе", "Уральск", "Куль сары", "Жанаозен",
    "Бейнеу", "Сексеул", "Кандагаш", "Казалы" , "Шалкар", "Арал", "Шетпе", "Алга"
] as const;

const DELIVERY_TYPES = ['AVIA', 'RAIL', 'TRUCK'] as const;

export const CreateItemSchema = z.object({
    title: z.string().min(2, 'Минимум 2 символа').max(255),
    recipientName: z.string().min(2, 'Введите ФИО получателя').max(255),
    recipientPhone: z.string().min(10, 'Введите корректный номер').max(20),
    senderName: z.string().min(2, 'Введите ФИО отправителя').max(255),
    senderPhone: z.string().min(10, 'Введите корректный номер').max(20),
    fromCity: z.literal('Алматы').default('Алматы'),
    toCity: z.enum(TO_CITIES, { errorMap: () => ({ message: 'Выберите город' }) }),
    weight: z.coerce.number().positive('Введите вес').max(10000),
    itemsCount: z.coerce.number().int().positive('Введите количество мест').max(10000).default(1),
    cashOnDelivery: z.coerce.number().min(0).optional(),
    comment: z.string().max(500).optional(),
    operatorName: z.string().min(2, 'Введите имя оператора').max(255),
    deliveryType: z.enum(DELIVERY_TYPES).default('TRUCK'),
});

export const CITY_LIST = CITIES;
export const TO_CITY_LIST = TO_CITIES;
export const DELIVERY_TYPE_LIST = DELIVERY_TYPES;

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