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
    const { setLocation, searchQuery, setSearchQuery } = useDashboard();

    return (
        <header className="fixed top-4 right-4 left-4 lg:left-[18rem] z-50 flex items-center justify-between h-14 px-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl transition-all duration-300 pointer-events-auto">
            {/* Mobile Menu Trigger */}
            <div className="lg:hidden">
                <MobileMenu />
            </div>

            {/* Search Bar - Desktop */}
            <div className="relative hidden md:flex items-center flex-1 max-w-md ml-4 mr-4">
                <Search className="absolute left-3 h-4 w-4 text-white/50" />
                <input
                    type="text"
                    placeholder="Search posts..."
                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:bg-white/10 focus:border-white/20 pl-10 pr-4 text-sm text-white placeholder:text-white/40 transition-all duration-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Mobile Search Trigger */}
            <button
                className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
                onClick={() => setIsSearchOpen(true)}
            >
                <Search className="h-5 w-5" />
            </button>

            {/* Right Actions */}
            <div className="flex items-center gap-3 ml-auto md:ml-0">
                <div className="md:hidden">
                    <SOSButton />
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-white/5 transition-colors">
                    <NotificationsMenu />
                </div>

                {/* Profile Link */}
                <Link href="/profile" className="block relative group">
                    <div className="h-10 w-10 rounded-full overflow-hidden border border-white/10 group-hover:border-white/30 transition-all duration-200 shadow-lg">
                        {user?.avatar ? (
                            <img
                                src={user.avatar.startsWith('http') ? user.avatar : `${API_URL}/${user.avatar.replace(/^\//, '')}`}
                                alt={user.name || 'Profile'}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = "https://github.com/shadcn.png"
                                }}
                            />
                        ) : (
                            <img
                                src="https://github.com/shadcn.png"
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        )}
                    </div>
                </Link>
            </div>

            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </header>
    );
}
