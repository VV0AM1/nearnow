"use client";

import { useMemo } from "react";
import { Shield, AlertTriangle, Info, MapPin, Zap } from "lucide-react";
import { Post } from "../../../types/post";

interface MapStatsOverlayProps {
    posts: any[];
    radius: number;
    onReportClick?: () => void;
}

export default function MapStatsOverlay({ posts, radius, onReportClick }: MapStatsOverlayProps) {
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
        <div className="w-[260px] sm:w-72 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 p-3 sm:p-4 shadow-2xl flex flex-col gap-3 sm:gap-4 animate-in fade-in slide-in-from-left-4 duration-500 pointer-events-auto">

            {/* Top Row: System Status */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">System Online</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                    <span className="text-[10px] font-bold text-zinc-400">ACTIVE</span>
                    <span className="text-[10px] font-black text-white">{posts.length}</span>
                </div>
            </div>

            {/* Total Alerts & Density */}
            <div className="flex items-end justify-between">
                <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Total Alerts</h3>
                    <div className="text-3xl font-black text-white leading-none">
                        {posts.length}
                        <span className="text-xs font-bold text-zinc-500 ml-1">/{radius}km</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-[10px] font-bold mb-1 ${risk.color}`}>{risk.label}</div>
                    <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden ml-auto">
                        <div className={`h-full rounded-full transition-all duration-1000 ${risk.bar}`} style={{ width: `${density}%` }} />
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-4 gap-1">
                <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/5">
                    <AlertTriangle className="h-3 w-3 text-red-500 mb-1" />
                    <span className="text-xs font-bold text-white">{stats.CRIME + stats.SOS}</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/5">
                    <Shield className="h-3 w-3 text-emerald-500 mb-1" />
                    <span className="text-xs font-bold text-white">{stats.SAFETY}</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/5">
                    <MapPin className="h-3 w-3 text-purple-500 mb-1" />
                    <span className="text-xs font-bold text-white">{stats.LOST_FOUND}</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/5">
                    <Info className="h-3 w-3 text-blue-500 mb-1" />
                    <span className="text-xs font-bold text-white">{stats.GENERAL}</span>
                </div>
            </div>

            {/* Report Button */}
            <button
                onClick={onReportClick}
                className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-red-900/20 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
            >
                <span>+</span> REPORT INCIDENT
            </button>
        </div>
    );
}
