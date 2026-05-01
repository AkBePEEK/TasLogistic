export const normalizePhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`;
    if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`;
    if (digits.length === 12 && digits.startsWith('7')) return `+${digits}`;
    throw new Error('INVALID_PHONE_FORMAT');
};