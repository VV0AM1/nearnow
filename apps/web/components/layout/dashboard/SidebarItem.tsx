"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem } from "../../../types/ui";
import { cn } from "../../../lib/utils";
import { useNotifications } from "../../../context/NotificationContext";

interface SidebarItemProps {
    item: NavItem;
    isSidebarOpen: boolean;
}

export default function SidebarItem({ item, isSidebarOpen }: SidebarItemProps) {
    const pathname = usePathname();
    const isActive = pathname === item.href;
    const { unreadCount } = useNotifications();

    return (
        <Link
            href={item.href}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative ${isActive
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                } ${!isSidebarOpen ? 'justify-center' : ''}`}
        >
            <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.label === 'Notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-black"></span>
                    </span>
                )}
            </div>

            {isSidebarOpen && (
                <div className="flex-1 flex justify-between items-center">
                    <span className="font-medium">{item.label}</span>
                    {item.label === 'Notifications' && unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                            {unreadCount}
                        </span>
                    )}
                </div>
            )}
        </Link>
    );
}
