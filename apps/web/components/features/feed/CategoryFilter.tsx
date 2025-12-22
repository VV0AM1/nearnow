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

import { useHaptic } from "../../../hooks/useHaptic";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

export default function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { triggerHaptic } = useHaptic();

    const handleSelect = (id: string) => {
        // ... handled in original function but we need to inject haptic here? 
        // Actually better to just wrap the onSelect in the parent or add it here.
        // Let's add it here.
        triggerHaptic("light");

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

    const handleOpen = () => {
        triggerHaptic("light");
        setIsMobileOpen(true);
    };

    const handleDragEnd = (event: any, info: PanInfo) => {
        if (info.offset.y > 100) {
            triggerHaptic("medium");
            setIsMobileOpen(false);
        }
    };

    const selectedCount = selected.includes('ALL') ? 0 : selected.length;

    // Mobile Filter Button Logic
    const MobileFilterButton = () => (
        <button
            onClick={handleOpen}
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
        <AnimatePresence>
            {isMobileOpen && (
                <div className="fixed inset-0 z-[2030] bg-black/60 backdrop-blur-sm flex items-end justify-center md:hidden">
                    {/* Tap to close backdrop */}
                    <div className="absolute inset-0" onClick={() => setIsMobileOpen(false)} />

                    <motion.div
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.2 }}
                        onDragEnd={handleDragEnd}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="bg-background w-full rounded-t-3xl p-6 pb-12 border-t border-white/10 relative z-10"
                    >
                        <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mb-6" />
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
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <MobileFilterButton />
            <DesktopList />
            <MobileModal />
        </>
    );
}
