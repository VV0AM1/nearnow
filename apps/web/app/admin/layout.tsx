"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthContext } from "../../context/AuthContext";
import { Role } from "../../types/user";
import { cn } from "@/lib/utils";

const TABS = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/users", label: "Users" },
];

/** Moderation area: admins only, inside the normal app frame with its own tabs. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuthContext();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (loading) return;
        if (!user) router.push("/login");
        else if (user.role !== Role.ADMIN) router.push("/");
    }, [user, loading, router]);

    if (loading || !user || user.role !== Role.ADMIN) {
        return (
            <div className="flex h-dvh w-full items-center justify-center">
                <Loader2 className="size-7 animate-spin text-primary" aria-label="Loading" />
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <h1 className="text-[28px] font-bold tracking-tight sm:text-[32px]">Moderation</h1>
                    <nav aria-label="Moderation" className="inline-flex rounded-[12px] bg-surface-2 p-1">
                        {TABS.map((t) => {
                            const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
                            return (
                                <Link
                                    key={t.href}
                                    href={t.href}
                                    aria-current={active ? "page" : undefined}
                                    className={cn("rounded-[9px] px-4 py-1.5 text-[13px] font-semibold", active ? "bg-surface text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground hover:text-foreground")}
                                >
                                    {t.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                {children}
            </div>
        </DashboardLayout>
    );
}
