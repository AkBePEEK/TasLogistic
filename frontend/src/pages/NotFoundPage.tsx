import React from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
            <div className="text-center">
                <p className="text-6xl font-bold text-indigo-600">404</p>
                <h1 className="mt-4 text-2xl font-bold text-gray-900">
                    Страница не найдена
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                    Страница которую вы ищете не существует или была удалена
                </p>
                <Link
                    to="/"
                    className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                    На главную
                </Link>
            </div>
        </div>
    );
}