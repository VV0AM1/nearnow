"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { CATEGORIES } from "../../../config/categories";
import { motion, AnimatePresence } from "framer-motion";

export interface MobileMapFilterProps {
    selectedCategory: string[];
    onSelect: (id: string) => void;
    timeRange: string;
    onTimeRangeChange: (range: string) => void;
}

import { useHaptic } from "../../../hooks/useHaptic";
import { PanInfo } from "framer-motion";
import { Clock } from "lucide-react";

export default function MobileMapFilter({ selectedCategory, onSelect, timeRange, onTimeRangeChange }: MobileMapFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { triggerHaptic } = useHaptic();

    const handleOpen = () => {
        triggerHaptic("light");
        setIsOpen(true);
    };

    const handleDragEnd = (event: any, info: PanInfo) => {
        if (info.offset.y > 100) {
            triggerHaptic("medium");
            setIsOpen(false);
        }
    };

    const selectedCount = selectedCategory.includes('ALL') ? 0 : selectedCategory.length;

    return (
        <div className="absolute top-24 left-4 z-[400]">
            <button
                onClick={handleOpen}
                className="h-12 w-12 flex items-center justify-center bg-card rounded-full border border-border shadow-sm active:scale-95 transition-transform"
            >
                <Filter className="h-4 w-4 text-white" />
                {selectedCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full border border-black flex items-center justify-center text-[10px] font-bold text-white">
                        {selectedCount}
                    </div>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[2030] bg-black/80 backdrop-blur-sm flex items-end justify-center">
                        {/* Tap to close backdrop */}
                        <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

                        <motion.div
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={{ top: 0, bottom: 0.2 }}
                            onDragEnd={handleDragEnd}
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="bg-background w-full rounded-t-3xl p-6 pb-12 border-t border-white/10 relative z-10 max-h-[85vh] overflow-y-auto"
                        >
                            <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mb-6" />
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Map Filters</h3>
                                <button onClick={() => setIsOpen(false)} className="p-2 bg-secondary/50 rounded-full">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Time Filter Section */}
                                <div>
                                    <h4 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Time Range
                                    </h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: '24h', label: '24h' },
                                            { id: '7d', label: '7 Days' },
                                            { id: 'all', label: 'All Time' }
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => onTimeRangeChange(t.id)}
                                                className={`p-2 rounded-lg text-sm font-medium border transition-all ${timeRange === t.id
                                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                    : 'bg-secondary/20 border-transparent text-zinc-400'
                                                    }`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Categories Section */}
                                <div>
                                    <h4 className="text-sm font-medium text-zinc-400 mb-3">Categories</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {CATEGORIES.map((cat: any) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => {
                                                    onSelect(cat.id);
                                                }}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedCategory.includes(cat.id)
                                                    ? 'bg-primary/20 border-primary text-primary'
                                                    : 'bg-secondary/20 border-transparent hover:bg-secondary/40'
                                                    }`}
                                            >
                                                <div className={`h-3 w-3 rounded-full ${cat.color}`} />
                                                <span className="font-medium text-sm">{cat.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full mt-8 bg-primary text-primary-foreground font-bold py-3 rounded-xl"
                            >
                                Apply Filters
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
