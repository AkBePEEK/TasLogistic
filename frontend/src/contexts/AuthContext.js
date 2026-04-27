import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useEffect, useState, } from 'react';
import { authApi } from '@/api/auth';
export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        authApi
            .me()
            .then((res) => setUser(res.data.data ?? null))
            .catch(() => setUser(null))
            .finally(() => setIsLoading(false));
        const handleUnauthorized = () => setUser(null);
        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);
    const login = useCallback(async (email, password) => {
        const res = await authApi.login({ email, password });
        setUser(res.data.data ?? null);
    }, []);
    const logout = useCallback(async () => {
        await authApi.logout();
        setUser(null);
    }, []);
    const register = useCallback(async (email, password, role) => {
        const res = await authApi.register({ email, password, role });
        setUser(res.data.data ?? null);
    }, []);
    return (_jsx(AuthContext.Provider, { value: { user, isLoading, login, logout, register }, children: children }));
}
