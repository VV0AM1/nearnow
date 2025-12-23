"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useAuthContext } from "../../context/AuthContext";
import NotificationsMenu from "../features/notifications/NotificationsMenu";
import MobileMenu from "./MobileMenu";
import SearchModal from "../features/search/SearchModal";
import { API_URL } from "@/lib/config";

export default function DashboardHeader() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { user } = useAuthContext();

    return (
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-md sticky top-0 z-30">
            {/* Mobile Menu Trigger */}
            <div className="md:hidden -ml-2">
                <MobileMenu />
            </div>

            {/* Search Bar (Desktop) */}
            <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-secondary/20 rounded-lg border border-border w-96 hover:bg-secondary/30 transition-colors text-left"
            >
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground/50">Search alerts, areas...</span>
            </button>

            {/* Hidden Triggers for Mobile interactions */}
            <button id="mobile-search-trigger" className="hidden" onClick={() => setIsSearchOpen(true)} />

            {/* Mobile Search Icon */}
            <button className="md:hidden p-2 text-muted-foreground" onClick={() => setIsSearchOpen(true)}>
                <Search className="h-5 w-5" />
            </button>

            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            <div className="flex items-center gap-4">
                <NotificationsMenu />

                {/* Mobile Profile Avatar (Desktop Sidebar handles it generally, but good to have fallback or specific mobile placement) */}
                <Link href="/profile" className="relative h-8 w-8 rounded-full bg-secondary/50 overflow-hidden border border-white/10 md:hidden">
                    {user?.avatar ? (
                        <img
                            src={user.avatar.startsWith('http') ? user.avatar : `${API_URL}${user.avatar}`}
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
