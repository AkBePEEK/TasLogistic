const KZ_MONTHS = ['қаң', 'ақп', 'нау', 'сәу', 'мам', 'мау', 'шіл', 'там', 'қыр', 'қаз', 'қар', 'жел'];
const RU_MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const KZ_MONTHS_LONG = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];
const RU_MONTHS_LONG = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

export function formatDate(date: string | Date, language: string): string {
    const d = new Date(date);
    const months = language === 'kz' ? KZ_MONTHS : RU_MONTHS;

    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day} ${month}, ${hours}:${minutes}`;
}

export function formatDateFull(date: string | Date, language: string): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year}, ${hours}:${minutes}`;
}

export function formatDateLong(date: string | Date, language: string): string {
    const d = new Date(date);
    const months = language === 'kz' ? KZ_MONTHS_LONG : RU_MONTHS_LONG;

    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

export function formatDateWithYear(date: string | Date, language: string): string {
    const d = new Date(date);
    const months = language === 'kz' ? KZ_MONTHS : RU_MONTHS;

    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

export function formatDateOnly(date: string | Date, language: string): string {
    const d = new Date(date);
    const months = language === 'kz' ? KZ_MONTHS_LONG : RU_MONTHS_LONG;

    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
}