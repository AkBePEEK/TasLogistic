import React from 'react';
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const toggle = (lang: string) => {
        void i18n.changeLanguage(lang);
        localStorage.setItem('lang', lang);
    };

    return (
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
                onClick={() => toggle('ru')}
                className={[
                    'px-3 py-1.5 text-xs font-semibold transition-colors',
                    i18n.language === 'ru'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50',
                ].join(' ')}
            >
                РУС
            </button>
            <button
                onClick={() => toggle('kz')}
                className={[
                    'px-3 py-1.5 text-xs font-semibold transition-colors',
                    i18n.language === 'kz'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50',
                ].join(' ')}
            >
                ҚАЗ
            </button>
        </div>
    );
}