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
    selected: string[];
    onSelect: (ids: string[]) => void;
}

import { useState } from "react";
import { Filter, X } from "lucide-react";

// ... existing CATEGORIES and getCategoryColor ...

export default function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleSelect = (id: string) => {
        if (id === 'ALL') {
            onSelect(['ALL']);
            return;
        }

        let newSelected = [...selected];
        if (newSelected.includes('ALL')) {
            newSelected = [];
        }

        if (newSelected.includes(id)) {
            newSelected = newSelected.filter(c => c !== id);
        } else {
            newSelected.push(id);
        }

        if (newSelected.length === 0) {
            newSelected = ['ALL'];
        }

        onSelect(newSelected);
    };

    const selectedCount = selected.includes('ALL') ? 0 : selected.length;

    // Mobile Filter Button Logic
    const MobileFilterButton = () => (
        <button
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden flex items-center justify-center gap-2 px-4 py-2 bg-secondary/50 rounded-full border border-border text-sm font-medium"
        >
            <Filter className="h-4 w-4" />
            Filters {selectedCount > 0 && <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">{selectedCount}</span>}
        </button>
    );

    // Desktop List Logic
    const DesktopList = () => (
        <div className="hidden md:flex gap-2 overflow-x-auto p-2 pb-4 no-scrollbar">
            {CATEGORIES.map(cat => (
                <CategoryBadge
                    key={cat.id}
                    category={cat.id}
                    isSelected={selected.includes(cat.id)}
                    onClick={() => handleSelect(cat.id)}
                />
            ))}
        </div>
    );

    // Mobile Modal Logic
    const MobileModal = () => (
        isMobileOpen && (
            <div className="fixed inset-0 z-[2030] bg-black/60 backdrop-blur-sm flex items-end justify-center md:hidden animate-in fade-in duration-200">
                <div className="bg-background w-full rounded-t-3xl p-6 pb-12 border-t border-white/10 animate-in slide-in-from-bottom duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Filter Alerts</h3>
                        <button onClick={() => setIsMobileOpen(false)} className="p-2 bg-secondary/50 rounded-full">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {CATEGORIES.map(cat => (
                            <CategoryBadge
                                key={cat.id}
                                category={cat.id}
                                isSelected={selected.includes(cat.id)}
                                onClick={() => handleSelect(cat.id)}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="w-full mt-8 bg-primary text-primary-foreground font-bold py-3 rounded-xl"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        )
    );

    return (
        <>
            <MobileFilterButton />
            <DesktopList />
            <MobileModal />
        </>
    );
}
