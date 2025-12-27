import { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';

type AuthType = {
    user: string | null;
    isLoading: boolean;
    signIn: (token: string) => void;
    signOut: () => void;
};

const AuthContext = createContext<AuthType>({
    user: null,
    isLoading: true,
    signIn: () => { },
    signOut: () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

function useProtectedRoute(user: string | null) {
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        const inAuthGroup = (segments[0] as string) === '(app)';

        if (
            // If the user is not signed in and the initial segment is not anything in the auth group.
            !user &&
            inAuthGroup
        ) {
            // Redirect to the sign-in page.
            router.replace('/login');
        } else if (user && !inAuthGroup) {
            // Redirect away from the sign-in page.
            router.replace('/(app)/home' as any);
        }
    }, [user, segments]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkToken = async () => {
            try {
                const token = await SecureStore.getItemAsync('token');
                if (token) {
                    setUser(token);
                }
            } catch (e) {
                console.error('Failed to fetch token', e);
            } finally {
                setIsLoading(false);
            }
        };
        checkToken();
    }, []);

    // useProtectedRoute(user);

    const signIn = async (token: string) => {
        await SecureStore.setItemAsync('token', token);
        setUser(token);
    };

    const signOut = async () => {
        await SecureStore.deleteItemAsync('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                signIn,
                signOut,
                user,
                isLoading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
