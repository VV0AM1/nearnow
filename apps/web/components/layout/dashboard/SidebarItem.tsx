"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem } from "../../../types/ui";
import { cn } from "../../../lib/utils";
import { useNotifications } from "../../../context/NotificationContext";
import styles from "./Sidebar.module.css";

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
            className={cn(
                styles.navItem,
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative text-sm group",
                isActive ? styles.activeItem : "text-muted-foreground hover:text-white",
                !isSidebarOpen && "justify-center"
            )}
        >
            <div className="relative z-10">
                <item.icon className={cn("h-5 w-5", isActive ? "text-blue-400" : "text-slate-400 group-hover:text-blue-300")} />
                {item.label === 'Notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-black"></span>
                    </span>
                )}
            </div>

            {isSidebarOpen && (
                <div className="flex-1 flex justify-between items-center z-10">
                    <span className={cn("font-medium", isActive ? "text-white" : "")}>{item.label}</span>
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
