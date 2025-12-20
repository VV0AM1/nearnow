import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../lib/config";
import { getToken, logout } from "../lib/auth";

interface UserProfile {
    id: string;
    email: string;
    name?: string | null;
    avatar?: string | null;
    reputation?: number;
    role?: string;
    _count?: {
        posts: number;
        votes: number;
    };
}

export function useProfile() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = getToken();
            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const res = await fetch(`${API_URL}/auth/me`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (res.status === 401) {
                    logout();
                    router.push("/login");
                    return;
                }

                if (!res.ok) throw new Error("Failed to fetch profile");

                const data = await res.json();
                setUser(data);
            } catch (err) {
                setError("Could not load profile");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    return { user, loading, error };
}
