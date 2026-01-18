"use client";

import { useState } from "react";
import { Menu, Home, Map, Bookmark, User as UserIcon, ShieldAlert } from "lucide-react";
import SidebarItem from "./SidebarItem";
import UserProfilePill from "./UserProfilePill";
import SOSButton from "../../features/safety/SOSButton";
import { useAuthContext } from "../../../context/AuthContext";
import { NavItem } from "../../../types/ui";
import { User } from "../../../types/user";

import { MAIN_NAV_ITEMS, USER_NAV_ITEMS } from "../config/navigation";

// Combine items or use mainly MAIN for sidebar
const NAV_ITEMS = [...MAIN_NAV_ITEMS, ...USER_NAV_ITEMS];

interface SidebarProps {
    initialUser?: User;
}

export default function Sidebar({ initialUser }: SidebarProps) {
    const { user: contextUser, logout } = useAuthContext();
    const user = contextUser || initialUser || null;

    const [isOpen, setIsOpen] = useState(true);

    return (
        <aside className={`${isOpen ? 'w-64' : 'w-20'} hidden xl:flex flex-col border-r border-border bg-secondary/5 transition-all duration-300`}>
            {/* Header / Toggle */}
            <div className="h-16 flex items-center px-6 border-b border-border">
                <span className={`text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent ${!isOpen && 'hidden'}`}>
                    NearNow
                </span>
                <button onClick={() => setIsOpen(!isOpen)} className={`ml-auto text-muted-foreground hover:text-foreground ${!isOpen && 'mx-auto ml-0'}`}>
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 space-y-2">
                {NAV_ITEMS.map((item) => (
                    <SidebarItem
                        key={item.href}
                        item={item}
                        isSidebarOpen={isOpen}
                    />
                ))}
                {user?.role === 'ADMIN' && (
                    <SidebarItem
                        item={{
                            label: 'Admin',
                            href: '/admin',
                            icon: ShieldAlert
                        }}
                        isSidebarOpen={isOpen}
                    />
                )}
            </nav>

            {/* Footer / Profile */}
            <div className="p-4 border-t border-border flex flex-col gap-4">
                <SOSButton />
                <UserProfilePill
                    user={user}
                    isSidebarOpen={isOpen}
                    onLogout={logout}
                />
            </div>
        </aside>
    );
}
