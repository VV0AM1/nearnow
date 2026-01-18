"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useAuthContext } from "../../context/AuthContext";
import NotificationsMenu from "../features/notifications/NotificationsMenu";
import MobileMenu from "./MobileMenu";
import SearchModal from "../features/search/SearchModal";
import SOSButton from "../features/safety/SOSButton";
import { API_URL } from "@/lib/config";
import { useDashboard } from "../../context/DashboardContext";

export default function DashboardHeader() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { user } = useAuthContext();
    const { setLocation } = useDashboard();

    return (
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            {/* Mobile Menu Trigger */}
            <div className="md:hidden -ml-2">
                <MobileMenu />
            </div>

            {/* Search Bar (Desktop) - Generic Search */}
            <div className="hidden md:block w-full max-w-md mx-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search posts..."
                        className="w-full bg-secondary/20 border border-border rounded-lg pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                    />
                </div>
            </div>

            {/* Hidden Triggers for Mobile interactions */}
            <button id="mobile-search-trigger" className="hidden" onClick={() => setIsSearchOpen(true)} />

            {/* Mobile Search Icon */}
            <button className="md:hidden p-2 text-muted-foreground" onClick={() => setIsSearchOpen(true)}>
                <Search className="h-5 w-5" />
            </button>

            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            <div className="flex items-center gap-4">
                <div className="md:hidden">
                    <SOSButton />
                </div>
                <NotificationsMenu />

                {/* Mobile Profile Avatar (Desktop Sidebar handles it generally, but good to have fallback or specific mobile placement) */}
                <Link href="/profile" className="relative h-8 w-8 rounded-full bg-secondary/50 overflow-hidden border border-white/10 md:hidden">
                    {user?.avatar ? (
                        <img
                            src={user.avatar.startsWith('http') ? user.avatar : user.avatar}
                            alt={user.name || 'Profile'}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary to-purple-500" />
                    )}
                </Link>
            </div>
        </header>
    );
}
