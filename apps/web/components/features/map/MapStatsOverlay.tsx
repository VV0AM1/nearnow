"use client";

import { useMemo } from "react";
import { Shield, AlertTriangle, Info, MapPin, Zap } from "lucide-react";
import { Post } from "../../../types/post";

interface MapStatsOverlayProps {
    posts: any[];
    radius: number;
}

export default function MapStatsOverlay({ posts, radius }: MapStatsOverlayProps) {
    const defaultCategories = {
        CRIME: 0,
        SAFETY: 0,
        SOS: 0,
        GENERAL: 0,
        LOST_FOUND: 0
    };

    const stats = useMemo(() => {
        const counts = posts.reduce((acc, post) => {
            const cat = post.category ? post.category.toUpperCase() : 'GENERAL';
            // Handle variations if needed, relying on standard types
            if (cat === 'THEFT' || cat === 'ASSAULT' || cat === 'DANGER') acc.CRIME++;
            else if (cat === 'SAFE_WALK' || cat === 'LIGHTING') acc.SAFETY++;
            else if (cat === 'SOS') acc.SOS++;
            else if (cat === 'LOST' || cat === 'FOUND') acc.LOST_FOUND++;
            else acc.GENERAL++; // Default bucket
            return acc;
        }, { ...defaultCategories });

        return counts;
    }, [posts]);

    // Calculate "Safety Score" or "Activity Density"
    // Heuristic: More posts / smaller radius = High Density (Potentially Riskier if Crime, Safer if Safety?)
    // Simplified: Just "Activity Level"
    const density = useMemo(() => {
        if (radius === 0) return 0;
        // Arbitrary density calc: posts per 10km radius unit
        const rawDensity = posts.length / (radius * 0.5);
        return Math.min(rawDensity * 10, 100); // Cap at 100
    }, [posts.length, radius]);

    const getRiskLabel = (score: number) => {
        if (score < 30) return { label: "Low Activity", color: "text-emerald-400", bar: "bg-emerald-500" };
        if (score < 70) return { label: "Moderate", color: "text-yellow-400", bar: "bg-yellow-500" };
        return { label: "High Activity", color: "text-red-400", bar: "bg-red-500" };
    };

    const risk = getRiskLabel(density);

    return (
        <div className="w-56 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-500 pointer-events-auto">
            {/* Header / Main Stat */}
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Total Alerts</h3>
                    <div className="text-3xl font-black text-white flex items-baseline gap-1">
                        {posts.length}
                        <span className="text-xs font-normal text-zinc-500">in {radius}km</span>
                    </div>
                </div>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 ${risk.color}`}>
                    <Zap className="h-4 w-4" />
                </div>
            </div>

            {/* Density Bar */}
            <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500">
                    <span>Density</span>
                    <span className={risk.color}>{risk.label}</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${risk.bar}`}
                        style={{ width: `${density}%` }}
                    />
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    <span className="text-xs font-bold text-zinc-300">{stats.CRIME + stats.SOS} <span className="text-[10px] font-normal text-zinc-500">Crit</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs font-bold text-zinc-300">{stats.SAFETY} <span className="text-[10px] font-normal text-zinc-500">Safe</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <Info className="h-3 w-3 text-blue-500" />
                    <span className="text-xs font-bold text-zinc-300">{stats.GENERAL} <span className="text-[10px] font-normal text-zinc-500">Gen</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-purple-500" />
                    <span className="text-xs font-bold text-zinc-300">{stats.LOST_FOUND} <span className="text-[10px] font-normal text-zinc-500">Lost</span></span>
                </div>
            </div>
        </div>
    );
}
