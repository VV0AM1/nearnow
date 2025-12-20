import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken, setUserId } from "../lib/auth";
import { useAuthContext } from "../context/AuthContext";

interface AuthResponse {
    accessToken: string;
    user: {
        id: string;
        email: string;
        name: string;
    }
}

export function useAuth() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login: contextLogin } = useAuthContext();

    const login = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("http://localhost:3002/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Login failed");
            }

            // OTP sent, do not set token yet
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const signup = async (email: string, password: string, name: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("http://localhost:3002/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, name }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Signup failed");
            }

            // OTP sent
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (email: string, otp: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("http://localhost:3002/auth/otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Verification failed");
            }

            const data: AuthResponse = await res.json();
            setToken(data.accessToken);
            setUserId(data.user.id);
            contextLogin(data.accessToken, data.user.id);
            router.push("/");
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = async (token: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("http://localhost:3002/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Google Login failed");
            }

            const data: AuthResponse = await res.json();
            setToken(data.accessToken);
            setUserId(data.user.id);

            // Sync with context
            contextLogin(data.accessToken, data.user.id);

            router.push("/");
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { login, signup, verifyOtp, googleLogin, loading, error };
}
