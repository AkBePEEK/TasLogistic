import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

/**
 * Хук для доступа к auth state.
 * Бросает ошибку если используется вне AuthProvider —
 * это помогает поймать ошибку на этапе разработки.
 */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}