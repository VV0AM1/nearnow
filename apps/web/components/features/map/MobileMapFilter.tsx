"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { CATEGORIES } from "../feed/CategoryFilter";
import { motion, AnimatePresence } from "framer-motion";

interface MobileMapFilterProps {
    selectedCategory: string;
    onSelect: (id: string) => void;
}

export default function MobileMapFilter({ selectedCategory, onSelect }: MobileMapFilterProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="md:hidden absolute top-24 left-4 z-[400]">
            <button
                onClick={() => setIsOpen(true)}
                className="h-10 w-10 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-lg"
            >
                <Filter className="h-4 w-4 text-white" />
                {selectedCategory !== 'ALL' && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border border-black" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[2030] bg-black/80 backdrop-blur-sm flex items-end justify-center">
                        {/* Tap to close backdrop */}
                        <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="bg-background w-full rounded-t-3xl p-6 pb-12 border-t border-white/10 relative z-10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Map Filters</h3>
                                <button onClick={() => setIsOpen(false)} className="p-2 bg-secondary/50 rounded-full">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {CATEGORIES.map((cat: any) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            onSelect(cat.id);
                                            setIsOpen(false);
                                        }}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedCategory === cat.id
                                            ? 'bg-primary/20 border-primary text-primary'
                                            : 'bg-secondary/20 border-transparent hover:bg-secondary/40'
                                            }`}
                                    >
                                        <div className={`h-3 w-3 rounded-full ${cat.color}`} />
                                        <span className="font-medium text-sm">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
