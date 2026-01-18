"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ShieldAlert, BarChart3, AlertTriangle, Info } from "lucide-react";

interface SafetyAnalyticsProps {
    neighborhoodName?: string;
    score: number;
    totalAlerts: number;
    crimeCount: number;
    trend: 'up' | 'down' | 'stable';
}

const RISK_TYPES = [
    { label: "Theft & Pickpocketing", baseRate: 0.45, color: "bg-orange-500" },
    { label: "Harassment", baseRate: 0.25, color: "bg-red-500" },
    { label: "Vandalism", baseRate: 0.20, color: "bg-yellow-500" },
    { label: "Assault", baseRate: 0.10, color: "bg-purple-500" },
];

export function SafetyAnalytics({ neighborhoodName = "Current Sector", score, totalAlerts, crimeCount, trend = 'stable' }: SafetyAnalyticsProps) {

    // Simulate type breakdown based on total crime count
    // In a real app, this would come from the backend aggregation
    const getRiskPercentage = (baseRate: number) => {
        if (crimeCount === 0) return 0;
        // Add some variance but keep it roughly consistent
        return Math.min(100, Math.round((baseRate * 100) + (Math.sin(crimeCount) * 5)));
    };

    return (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden flex flex-col h-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-blue-500">Threat Analytics</span>
                </div>
                <div className="flex items-center gap-3">
                    {totalAlerts > 0 ? (
                        <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20 font-bold">
                            {totalAlerts} Active Reports
                        </span>
                    ) : (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                            Sector Clear
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col gap-6">

                    {/* Top Row: Score & Trend */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-secondary/10 rounded-lg p-3 border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <ShieldAlert className="w-8 h-8" />
                            </div>
                            <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-1">Safety Score</p>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-2xl font-black ${score >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {score > 0 ? '+' : ''}{score}
                                </span>
                                <span className="text-xs text-zinc-400">Net Index</span>
                            </div>
                        </div>

                        <div className="bg-secondary/10 rounded-lg p-3 border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-1">24h Trend</p>
                            <div className="flex items-center gap-2">
                                {trend === 'up' ? (
                                    <>
                                        <TrendingUp className="h-5 w-5 text-emerald-400" />
                                        <span className="text-sm font-bold text-emerald-400">Improving</span>
                                    </>
                                ) : trend === 'down' ? (
                                    <>
                                        <TrendingDown className="h-5 w-5 text-red-400" />
                                        <span className="text-sm font-bold text-red-400">Degrading</span>
                                    </>
                                ) : (
                                    <>
                                        <Activity className="h-5 w-5 text-blue-400" />
                                        <span className="text-sm font-bold text-blue-400">Stable</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Risk Breakdown Bars */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold text-zinc-300">Risk Distribution</span>
                            <Info className="h-3 w-3 text-zinc-600" />
                        </div>

                        {crimeCount > 0 ? (
                            <div className="space-y-3">
                                {RISK_TYPES.map((type, i) => {
                                    const percent = getRiskPercentage(type.baseRate);
                                    return (
                                        <div key={type.label} className="group">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-[10px] font-medium text-zinc-400 group-hover:text-white transition-colors">{type.label}</span>
                                                <span className="text-[10px] font-mono text-zinc-500">{percent}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percent}%` }}
                                                    transition={{ duration: 1, delay: 0.2 + (i * 0.1), ease: "easeOut" }}
                                                    className={`h-full rounded-full ${type.color} opacity-80 group-hover:opacity-100 transition-opacity`}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-zinc-500 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/20">
                                <ShieldAlert className="h-6 w-6 mb-2 opacity-50" />
                                <span className="text-xs">No significant threats detected.</span>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
