"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getToken, getUserId, logout as authLogout } from "../lib/auth"; // We might need to adjust imports
import { useRouter } from "next/navigation";
import { User } from "../types/user";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (token: string, userId: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Hydrate auth state on mount
        const token = getToken();
        const userId = getUserId();

        if (token && userId) {
            setUser({ id: userId });
        }
        setLoading(false);
    }, []);

    const login = (token: string, userId: string) => {
        // Note: The actual cookie/localStorage setting is likely handled by the caller (hooks/useAuth)
        // or we should move it here. For now, we assume useAuth sets it, 
        // OR we can make this the source of truth.
        // Let's assume the helper `setToken` was called.
        setUser({ id: userId });
        router.refresh(); // Refresh to update server components/middleware if any
    };

    const logout = () => {
        authLogout();
        setUser(null);
        router.push("/login");
        router.refresh();
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated: !!user,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
}
