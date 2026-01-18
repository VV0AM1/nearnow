"use client";

interface RadiusSliderProps {
    value: number;
    onChange: (value: number) => void;
}

export default function RadiusSlider({ value, onChange }: RadiusSliderProps) {
    return (
        <div className="flex items-center gap-4 bg-card px-4 h-12 rounded-xl border border-border shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                Radius: <span className="text-foreground">{value} km</span>
            </span>
            <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
        </div>
    );
}
