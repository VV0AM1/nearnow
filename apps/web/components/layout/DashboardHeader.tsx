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
import styles from "./Navbar.module.css";
import { cn } from "@/lib/utils";

export default function DashboardHeader() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { user } = useAuthContext();
    const { setLocation } = useDashboard();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex items-start justify-between p-6 pointer-events-none md:pl-[calc(theme(spacing.80)+1.5rem)] lg:pl-6">
            {/* Mobile Menu Trigger - Pointer Auto */}
            <div className="md:hidden pointer-events-auto">
                <MobileMenu />
            </div>

            {/* Floating Search Pill - Pointer Auto */}
            <div className={cn("relative hidden md:flex items-center rounded-full pointer-events-auto", styles.searchPill)}>
                <Search className="absolute left-4 h-4 w-4 text-white/50" />
                <input
                    type="text"
                    placeholder="Search posts..."
                    className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-0 pl-10 pr-6 text-sm text-white placeholder:text-muted-foreground/50 rounded-full"
                    onFocus={() => setIsSearchOpen(true)}
                />
            </div>

            {/* Hidden Triggers for Mobile interactions */}
            <button id="mobile-search-trigger" className="hidden pointer-events-auto" onClick={() => setIsSearchOpen(true)} />

            {/* Mobile Search Icon */}
            <button className="md:hidden p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white pointer-events-auto" onClick={() => setIsSearchOpen(true)}>
                <Search className="h-5 w-5" />
            </button>

            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            {/* Actions - Pointer Auto */}
            <div className="flex items-center gap-4 pointer-events-auto">
                <div className="md:hidden">
                    <SOSButton />
                </div>

                {/* Wrap Notification in Glass Pill */}
                <div className={cn("rounded-full h-10 w-10 flex items-center justify-center", styles.actionPill)}>
                    <NotificationsMenu />
                </div>

                {/* Mobile Profile Avatar */}
                <Link href="/profile" className={cn("relative h-10 w-10 rounded-full overflow-hidden", styles.actionPill)}>
                    {user?.avatar ? (
                        <img
                            src={user.avatar.startsWith('http') ? user.avatar : `${API_URL}/${user.avatar.replace(/^\//, '')}`}
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
