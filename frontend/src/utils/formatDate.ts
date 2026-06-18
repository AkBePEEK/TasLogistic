export function formatDate(dateStr: string, lang: string): string {
    return new Date(dateStr).toLocaleString(lang === 'kz' ? 'kk-KZ' : 'ru-RU', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}