"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Users, Flag, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminSidebar() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    const navItems = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/reports", label: "Reports", icon: Flag },
    ];

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-zinc-950 border-b border-white/10 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-red-500" />
                    <span className="font-bold text-lg tracking-wide text-white">Admin</span>
                </div>
                <button onClick={toggleMenu} className="p-2 text-white/70 hover:text-white">
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar / Drawer */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950 border-r border-white/10 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:flex md:flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="hidden md:flex p-6 items-center gap-3 border-b border-white/10">
                    <Shield className="w-8 h-8 text-red-500" />
                    <span className="font-bold text-xl tracking-wide text-white">Admin</span>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-16 md:mt-0">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span>Exit Admin</span>
                    </Link>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
