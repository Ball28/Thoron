import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const API_BASE = 'http://localhost:3001/api';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    department: string | null;
    tenantId: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, role?: string) => Promise<void>;
    logout: () => void;
    authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('thoron_token'));
    const [loading, setLoading] = useState(true);

    // Authenticated fetch helper — auto-injects Authorization header
    const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const currentToken = localStorage.getItem('thoron_token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        };
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }
        return fetch(url, { ...options, headers });
    }, []);

    // Restore session from stored token
    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        authFetch(`${API_BASE}/auth/me`)
            .then(async (res) => {
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                } else {
                    // Token invalid — clear it
                    localStorage.removeItem('thoron_token');
                    setToken(null);
                }
            })
            .catch(() => {
                localStorage.removeItem('thoron_token');
                setToken(null);
            })
            .finally(() => setLoading(false));
    }, [token, authFetch]);

    const login = async (email: string, password: string) => {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Login failed');
        }

        const data = await res.json();
        localStorage.setItem('thoron_token', data.token);
        setToken(data.token);
        setUser(data.user);
    };

    const register = async (name: string, email: string, password: string, role = 'Customer') => {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Registration failed');
        }

        const data = await res.json();
        localStorage.setItem('thoron_token', data.token);
        setToken(data.token);
        setUser(data.user);
    };

    const logout = () => {
        localStorage.removeItem('thoron_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch }}>
            {children}
        </AuthContext.Provider>
    );
}
