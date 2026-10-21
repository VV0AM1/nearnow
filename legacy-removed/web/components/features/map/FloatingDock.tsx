import { motion } from "framer-motion";
import { CATEGORIES } from "../feed/CategoryFilter";

interface FloatingDockProps {
    selectedCategory: string[];
    onSelectCategory: (ids: string[]) => void;
}

export default function FloatingDock({ selectedCategory, onSelectCategory }: FloatingDockProps) {
    const handleSelect = (id: string) => {
        if (id === 'ALL') {
            onSelectCategory(['ALL']);
            return;
        }

        let newSelected = selectedCategory.includes('ALL') ? [] : [...selectedCategory];

        if (newSelected.includes(id)) {
            newSelected = newSelected.filter(c => c !== id);
        } else {
            newSelected.push(id);
        }

        if (newSelected.length === 0) {
            newSelected = ['ALL'];
        }

        onSelectCategory(newSelected);
    };

    return (
        <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-[20] items-end gap-2 px-2 pointer-events-none">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-1 p-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto"
            >
                {CATEGORIES.map((cat: { id: string; label: string; color: string }) => {
                    const isSelected = selectedCategory.includes(cat.id);
                    return (
                        <button
                            key={cat.id}
                            onClick={() => handleSelect(cat.id)}
                            className={`
                                relative flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap
                                ${isSelected ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'text-zinc-400 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            {/* Active Indicator Dot */}
                            {isSelected && (
                                <motion.div
                                    layoutId="dock-active"
                                    className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                                />
                            )}

                            <span className="relative z-10">{cat.label}</span>

                            {/* Color Glow on Hover/Active */}
                            <div className={`absolute inset-0 rounded-xl opacity-0 ${isSelected ? 'opacity-20' : 'group-hover:opacity-10'} transition-opacity duration-300 ${cat.color.replace('bg-', 'bg-')}`}></div>
                        </button>
                    )
                })}
            </motion.div>
        </div>
    );
}
