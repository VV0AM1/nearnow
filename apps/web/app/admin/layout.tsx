"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AdminSidebar from "./components/AdminSidebar";
import { useAuthContext } from "../../context/AuthContext";
import { Role } from "../../types/user";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuthContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login"); // Or access-denied page
            } else if (user.role !== Role.ADMIN) {
                router.push("/"); // Redirect non-admins to home
            }
        }
    }, [user, loading, router]);

    if (loading || !user || user.role !== Role.ADMIN) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black text-white">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden flex-col md:flex-row">
            {/* Responsive Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-black p-4 md:p-8 relative w-full">
                <div className="max-w-6xl mx-auto pb-20 md:pb-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
