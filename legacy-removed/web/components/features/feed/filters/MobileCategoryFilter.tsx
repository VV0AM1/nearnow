import { useState } from "react";
import { Filter, X } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useHaptic } from "../../../../hooks/useHaptic";
import CategoryBadge from "../../../common/display/CategoryBadge";
import { CATEGORIES } from "../../../../config/categories";

interface MobileCategoryFilterProps {
    selected: string[];
    onSelect: (id: string) => void;
}

export default function MobileCategoryFilter({ selected, onSelect }: MobileCategoryFilterProps) {
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

    const handleClose = () => setIsOpen(false);

    const handleSelect = (id: string) => {
        triggerHaptic("light");
        onSelect(id);
    };

    const selectedCount = selected.includes('ALL') ? 0 : selected.length;

    return (
        <>
            <button
                onClick={handleOpen}
                className="md:hidden h-12 w-12 flex items-center justify-center bg-card rounded-full border border-border shadow-sm active:scale-95 transition-transform"
            >
                <Filter className="h-5 w-5 text-foreground" />
                {selectedCount > 0 && (
                    <span className="absolute top-0 right-0 h-3 w-3 bg-primary rounded-full border-2 border-background box-content" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[2030] bg-black/60 backdrop-blur-sm flex items-end justify-center md:hidden">
                        {/* Tap to close backdrop */}
                        <div className="absolute inset-0" onClick={handleClose} />

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
                                <button onClick={handleClose} className="p-2 bg-secondary/50 rounded-full">
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
                                onClick={handleClose}
                                className="w-full mt-8 bg-primary text-primary-foreground font-bold py-3 rounded-xl"
                            >
                                Apply Filters
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
