import './i18n';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
        }>
            <App />
        </Suspense>
    </React.StrictMode>
);