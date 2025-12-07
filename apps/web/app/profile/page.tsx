"use client";

import { useEffect, useState } from "react";
import { User as UserIcon, LogOut, Mail, Hash } from "lucide-react";
import { getToken, logout } from "../../lib/auth";
import Button from "@/components/common/button/Button";
import { useRouter } from "next/navigation";

interface UserProfile {
    id: string;
    email: string;
    // Add other fields as they become available
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            const token = getToken();
            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const res = await fetch("http://localhost:3002/auth/me", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (res.status === 401) {
                    logout(); // Token invalid
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

    if (loading) return <div className="min-h-screen pt-24 text-center">Loading...</div>;

    if (!user) return null; // Or redirect handled in effect

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <UserIcon className="h-8 w-8 text-primary" />
                My Profile
            </h1>

            <div className="glass-card p-8 border border-border shadow-xl space-y-6">
                <div className="flex items-center gap-4 py-4 border-b border-border/50">
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                        <UserIcon className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Neighbor</h2>
                        <p className="text-sm text-muted-foreground">Local Resident</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="font-medium">{user.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">User ID</p>
                            <p className="font-mono text-sm">{user.id}</p>
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <Button
                        variant="secondary"
                        onClick={logout}
                        className="w-full justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );
}
