"use client";

import { LogOut, User as UserIcon } from "lucide-react";
import { User } from "../../../types/user";
import { calculateGamification, RANK_ICONS } from "../../../lib/gamification";

interface UserProfilePillProps {
    user: User | null;
    isSidebarOpen: boolean;
    onLogout: () => void;
}

export default function UserProfilePill({ user, isSidebarOpen, onLogout }: UserProfilePillProps) {
    const stats = calculateGamification(user?.reputation || 0);

    return (
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-white/5 ${!isSidebarOpen ? 'justify-center' : ''}`}>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20">
                {user?.avatar ? (
                    <img src={user.avatar.startsWith('http') ? user.avatar : `http://127.0.0.1:3002${user.avatar}`} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                    <UserIcon className="h-4 w-4 text-primary" />
                )}
            </div>
            {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold truncate text-foreground">{user?.name || 'Neighbor'}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border flex items-center gap-1">
                            <span>{RANK_ICONS[stats.rank]}</span>
                            <span>{stats.level}</span>
                        </span>
                    </div>
                    <button onClick={onLogout} className="text-xs text-muted-foreground hover:text-red-400 flex items-center gap-1 transition-colors">
                        <LogOut className="h-3 w-3" /> Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}
