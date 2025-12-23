"use client";

import { useAuthContext } from "../../context/AuthContext";

// ... inside component ...
const { user } = useAuthContext();
// ... inside jsx ...
<div className="flex items-center gap-4">
    <NotificationsMenu />
    <Link href="/profile" className="relative h-8 w-8 rounded-full bg-secondary/50 overflow-hidden border border-white/10 md:hidden">
        {user?.avatar ? (
            <img
                src={user.avatar.startsWith('http') ? user.avatar : `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`}
                alt={user.name || 'Profile'}
                className="h-full w-full object-cover"
            />
        ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary to-purple-500" />
        )}
    </Link>
</div>
import Sidebar from "./dashboard/Sidebar";
import NotificationsMenu from "../features/notifications/NotificationsMenu";
import MobileMenu from "./MobileMenu";
import Link from "next/link";
import { Search, Menu } from "lucide-react";
import { User } from "../../types/user";

interface DashboardLayoutProps {
    children: React.ReactNode;
    initialUser?: User;
}

export default function DashboardLayout({ children, initialUser }: DashboardLayoutProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar initialUser={initialUser} />

            <main className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-md sticky top-0 z-30">
                    {/* Mobile Menu Trigger (Vis only on mobile) */}
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
                    {/* Search Trigger (Hidden ID for Mobile Menu) */}
                    <button id="mobile-search-trigger" className="hidden" onClick={() => setIsSearchOpen(true)} />

                    {/* Search Trigger (Mobile Icon) */}
                    <button className="md:hidden p-2 text-muted-foreground" onClick={() => setIsSearchOpen(true)}>
                        <Search className="h-5 w-5" />
                    </button>

                    <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

                    <div className="flex items-center gap-4">
                        <NotificationsMenu />
                        <Link href="/profile" className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-500 md:hidden" />
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative">
                    {children}
                </div>
            </main>
        </div>
    );
}
