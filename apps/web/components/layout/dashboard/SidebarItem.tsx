"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem } from "../../../types/ui";
import { cn } from "../../../lib/utils"; // Assuming utils exist, or I'll use template literals if not

interface SidebarItemProps {
    item: NavItem;
    isSidebarOpen: boolean;
}

export default function SidebarItem({ item, isSidebarOpen }: SidebarItemProps) {
    const pathname = usePathname();
    const isActive = pathname === item.href;

    return (
        <Link
            href={item.href}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                } ${!isSidebarOpen ? 'justify-center' : ''}`}
        >
            <item.icon className="h-5 w-5" />
            {isSidebarOpen && <span className="font-medium">{item.label}</span>}
        </Link>
    );
}
