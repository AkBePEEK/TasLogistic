import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ru } from './ru';
import { kz } from './kz';

const savedLang = localStorage.getItem('lang') ?? 'ru';

void i18n.use(initReactI18next).init({
    resources: { ru, kz },
    lng: savedLang,
    fallbackLng: 'ru',
    interpolation: { escapeValue: false },
});

export default i18n;