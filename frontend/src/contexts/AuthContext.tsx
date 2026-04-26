import React, {
    createContext,
    useCallback,
    useEffect,
    useState,
    ReactNode,
} from 'react';
import { AuthUser } from '@/types';
import { authApi } from '@/api/auth';

interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (email: string, password: string, role: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        authApi
            .me()
            .then((res) => setUser(res.data.data ?? null))
            .catch(() => setUser(null))
            .finally(() => setIsLoading(false));

        const handleUnauthorized = () => setUser(null);
        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () =>
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await authApi.login({ email, password });
        setUser(res.data.data ?? null);
    }, []);

    const logout = useCallback(async () => {
        await authApi.logout();
        setUser(null);
    }, []);

    const register = useCallback(
        async (email: string, password: string, role: string) => {
            const res = await authApi.register({ email, password, role });
            setUser(res.data.data ?? null);
        },
        []
    );

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
}
