import { ButtonHTMLAttributes } from "react";
import CategoryBadge from "../../common/display/CategoryBadge";

export const CATEGORIES = [
    { id: "ALL", label: "All", color: "bg-slate-500" },
    { id: "GENERAL", label: "General", color: "bg-blue-500" },
    { id: "CRIME", label: "Crime", color: "bg-red-500" },
    { id: "SAFETY", label: "Safety", color: "bg-green-500" },
    { id: "LOST_FOUND", label: "Lost & Found", color: "bg-yellow-500" },
    { id: "EVENT", label: "Events", color: "bg-purple-500" },
    { id: "RECOMMENDATION", label: "Recs", color: "bg-pink-500" },
];

export const getCategoryColor = (cat: string) => {
    return CATEGORIES.find(c => c.id === cat)?.color || "bg-gray-500";
};

interface CategoryFilterProps {
    selected: string;
    onSelect: (id: string) => void;
}

export default function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
    return (
        <div className="flex gap-2 overflow-x-auto p-2 pb-4 no-scrollbar">
            {CATEGORIES.map(cat => (
                <CategoryBadge
                    key={cat.id}
                    category={cat.id}
                    isSelected={selected === cat.id}
                    onClick={() => onSelect(cat.id)}
                />
            ))}
        </div>
    );
}
