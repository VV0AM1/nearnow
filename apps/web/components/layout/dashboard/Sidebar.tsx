import { useState } from "react";
import { Menu, Home, Map, Bookmark, User as UserIcon, ShieldAlert } from "lucide-react";
import SidebarItem from "./SidebarItem";
import UserProfilePill from "./UserProfilePill";
import SOSButton from "../../features/safety/SOSButton";
import { useAuthContext } from "../../../context/AuthContext";
import { NavItem } from "../../../types/ui";
import { User } from "../../../types/user";
import styles from "./Sidebar.module.css";

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
        <aside className={styles.sidebarContainer}>
            <div className={`${styles.glassDock} ${isOpen ? styles.widthExpanded : styles.widthCollapsed}`}>
                {/* Header / Toggle */}
                <div className="h-16 flex items-center px-6 border-b border-white/5 relative">
                    <span className={`text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent transition-opacity duration-300 ${!isOpen && 'opacity-0 hidden'}`}>
                        NearNow
                    </span>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`text-muted-foreground hover:text-white transition-colors p-1 rounded-md hover:bg-white/10 ${!isOpen ? 'mx-auto' : 'ml-auto'}`}
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    {/* Neon Glow Line */}
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar">
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
                <div className="p-3 border-t border-white/5 flex flex-col gap-4 relative">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                    <SOSButton />
                    <UserProfilePill
                        user={user}
                        isSidebarOpen={isOpen}
                        onLogout={logout}
                    />
                </div>
            </div>
        </aside>
    );
}
