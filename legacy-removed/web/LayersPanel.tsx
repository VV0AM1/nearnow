import { motion } from "framer-motion";
import { useState } from "react";

interface LayersPanelProps {
    showSafety: boolean;
    toggleSafety: () => void;
    showHeatmap: boolean;
    toggleHeatmap: () => void;
}

export default function LayersPanel({ showSafety, toggleSafety, showHeatmap, toggleHeatmap }: LayersPanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end pointer-events-none">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg hover:bg-black/80 transition-colors mb-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
            </button>

            {/* Panel */}
            <motion.div
                initial={false}
                animate={{
                    opacity: isOpen ? 1 : 0,
                    scale: isOpen ? 1 : 0.95,
                    y: isOpen ? 0 : -10,
                    pointerEvents: isOpen ? 'auto' : 'none'
                }}
                className="bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl min-w-[200px] origin-top-right"
            >
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Map Layers</h3>

                <div className="space-y-3">
                    <LayerToggle
                        label="Safety Zones"
                        active={showSafety}
                        onClick={toggleSafety}
                        color="bg-emerald-500"
                    />
                    <LayerToggle
                        label="Heatmap (Beta)"
                        active={showHeatmap}
                        onClick={toggleHeatmap}
                        color="bg-orange-500"
                    />
                    <LayerToggle
                        label="Traffic"
                        active={false}
                        onClick={() => { }}
                        color="bg-blue-500"
                        disabled
                    />
                </div>
            </motion.div>
        </div>
    );
}

function LayerToggle({ label, active, onClick, color, disabled = false }: { label: string, active: boolean, onClick: () => void, color: string, disabled?: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center justify-between w-full group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <span className="text-sm font-medium text-zinc-200">{label}</span>
            <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${active ? color : 'bg-white/10'}`}>
                <motion.div
                    layout
                    className={`w-4 h-4 bg-white rounded-full shadow-sm`}
                    animate={{ x: active ? 16 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </div>
        </button>
    )
}
