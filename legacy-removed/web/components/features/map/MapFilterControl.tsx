"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";

interface MapFilterControlProps {
    timeRange: string;
    onTimeRangeChange: (range: string) => void;
}

const TIME_RANGES = [
    { label: "24 Hours", value: "24h" },
    { label: "7 Days", value: "7d" },
    { label: "All Time", value: "all" }
];

export default function MapFilterControl({ timeRange, onTimeRangeChange }: MapFilterControlProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute top-20 right-4 z-[20] flex flex-col items-end gap-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-3 rounded-full shadow-lg border border-white/10 backdrop-blur-md transition-all ${isOpen ? 'bg-primary text-white rotate-90' : 'bg-black/60 text-white hover:bg-black/80'
                    }`}
                title="Filter by Time"
            >
                {isOpen ? <X className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
            </button>

            {isOpen && (
                <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-xl w-64 space-y-4 animate-in slide-in-from-right-5 fade-in duration-200">
                    <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Time Range</h3>
                        <div className="flex bg-white/5 rounded-lg p-1">
                            {TIME_RANGES.map(range => (
                                <button
                                    key={range.value}
                                    onClick={() => onTimeRangeChange(range.value)}
                                    className={`flex-1 text-xs py-1 rounded-md transition-all ${timeRange === range.value
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-zinc-400 hover:text-white'
                                        }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
