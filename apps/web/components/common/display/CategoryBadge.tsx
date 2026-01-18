"use client";

import { CATEGORIES } from "../../features/feed/CategoryFilter";

interface CategoryBadgeProps {
    category: string;
    onClick?: () => void;
    isSelected?: boolean;
    className?: string;
}

export default function CategoryBadge({ category, onClick, isSelected, className = "" }: CategoryBadgeProps) {
    const catData = CATEGORIES.find(c => c.id === category);
    const label = catData?.label || category;
    const color = catData?.color || "bg-gray-500";

    if (onClick) {
        return (
            <button
                onClick={onClick}
                className={`
                    px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all
                    ${isSelected
                        ? `${color} text-white shadow-lg ring-2 ring-offset-2 ring-offset-background`
                        : 'bg-secondary/50 text-white hover:bg-secondary hover:text-foreground'
                    } ${className}
                `}
            >
                {label}
            </button>
        );
    }

    // Static Badge
    return (
        <span className={`${color} text-white px-2 py-0.5 rounded-full text-[10px] font-bold ${className}`}>
            {label}
        </span>
    );
}
