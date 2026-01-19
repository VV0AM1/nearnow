"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { API_URL } from "@/lib/config";
import { useGeoLocation } from "../../hooks/useGeoLocation";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { RankingCard } from "../../components/features/safety/RankingCard";
import { SafetyLeaderboard } from "../../components/features/safety/SafetyLeaderboard";
import { SafetyAnalytics } from "../../components/features/safety/SafetyAnalytics";
import { cn } from "@/lib/utils";
import { Shield, AlertTriangle, Activity, Target } from "lucide-react";

export default function SafetyPage() {
    const { location } = useGeoLocation();
    const [data, setData] = useState<{ topSafe: any[], topDangerous: any[], ranking: any[] }>({ topSafe: [], topDangerous: [], ranking: [] });
    const [radius, setRadius] = useState(5);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!location.latitude || !location.longitude) return;

        setLoading(true);
        fetch(`${API_URL}/neighborhoods/rankings?lat=${location.latitude}&lng=${location.longitude}&radius=${radius}`)
            .then(res => res.json())
            .then(resData => {
                if (resData && typeof resData === 'object') {
                    // Map backend fields to frontend component expectations
                    const mapItem = (item: any) => {
                        const safety = item.safetyCount || 0;
                        const crime = item.crimeCount || 0;
                        let netScore = safety - crime;
                        if (netScore < 0) netScore = 0;

                        return {
                            ...item,
                            alerts: item.totalCount,
                            score: netScore,
                            safetyCount: safety,
                            crimeCount: crime,
                            trend: netScore >= 5 ? 'up' : 'stable'
                        };
                    };

                    const mappedRanking = (resData.ranking || []).map(mapItem);

                    // 1. Top Safest Zones
                    const topSafe = [...mappedRanking]
                        .sort((a, b) => b.safetyCount - a.safetyCount)
                        .slice(0, 3);

                    // 2. High Attention Zones
                    const topDangerous = [...mappedRanking]
                        .sort((a, b) => b.crimeCount - a.crimeCount)
                        .slice(0, 3);

                    // 3. Main Ranking Table
                    const sortedRanking = [...mappedRanking].sort((a, b) => {
                        if (b.score !== a.score) {
                            return b.score - a.score;
                        }
                        return (b.alerts || 0) - (a.alerts || 0);
                    });

                    setData({
                        topSafe: topSafe,
                        topDangerous: topDangerous,
                        ranking: sortedRanking
                    });
                } else {
                    console.error("API Error or Invalid Format:", resData);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [location.latitude, location.longitude, radius]);

    return (
        <DashboardLayout>
            <div className="h-full flex flex-col overflow-hidden bg-background pt-24">
                {/* Fixed Header */}
                <div className="flex-none p-6 border-b border-white/5 bg-background/50 backdrop-blur-md flex justify-between items-center z-10">
                    <div>
                        <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
                            <Target className="h-6 w-6 text-blue-500" />
                            Safety Command Center
                        </h1>
                        <p className="text-zinc-400 text-xs mt-1">Real-time situational awareness • <span className="text-white font-mono">LIVE</span></p>
                    </div>

                    {/* Compact Radius Control */}
                    <div className="flex items-center gap-4 bg-secondary/10 px-4 py-2 rounded-lg border border-white/5">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Scope</span>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            step="1"
                            value={radius}
                            onChange={(e) => setRadius(parseInt(e.target.value))}
                            className="w-32 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                        />
                        <span className="text-sm font-bold text-white min-w-[3rem] text-right">{radius} km</span>
                    </div>
                </div>

                {/* Main Content Grid - No Window Scroll */}
                <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 relative">

                    {/* Left Panel: Rankings (Scrollable) */}
                    <div className="lg:col-span-8 h-full overflow-y-auto custom-scrollbar p-6 bg-gradient-to-b from-transparent to-black/20">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 animate-pulse gap-4">
                                <Activity className="h-8 w-8 animate-spin" />
                                <p>Scanning area security...</p>
                            </div>
                        ) : data.ranking.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                                <Shield className="h-12 w-12 mb-4 opacity-20" />
                                No neighborhoods found nearby. Try increasing the radius.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-emerald-500" />
                                        Regional Safety Index
                                    </h2>
                                    <span className="text-xs px-2 py-1 rounded bg-white/5 text-muted-foreground">{data.ranking.length} Zones Active</span>
                                </div>

                                <SafetyLeaderboard data={data.ranking} />

                                <div className="mt-8">
                                    <SafetyAnalytics
                                        score={data.ranking.reduce((acc, item) => acc + (item.score || 0), 0)}
                                        totalAlerts={data.ranking.reduce((acc, item) => acc + (item.alerts || 0), 0)}
                                        crimeCount={data.ranking.reduce((acc, item) => acc + (item.crimeCount || 0), 0)}
                                        trend={data.ranking.length > 0 && data.ranking[0].score < 0 ? 'down' : 'up'}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Highlights & Alerts (Scrollable) */}
                    <div className="lg:col-span-4 h-full overflow-y-auto custom-scrollbar border-l border-white/5 bg-secondary/5 p-6 space-y-8 backdrop-blur-sm">

                        {/* Top Safe Section */}
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-4 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Safest Zones
                            </h3>
                            <div className="space-y-3">
                                {data.topSafe.map((hood, i) => (
                                    <div key={hood.id} className="transform transition-all duration-300 hover:scale-[1.02] hover:-translate-x-1">
                                        <RankingCard neighborhood={hood} rank={i + 1} type="safe" />
                                    </div>
                                ))}
                                {data.topSafe.length === 0 && <div className="text-xs text-muted-foreground italic">No data available</div>}
                            </div>
                        </div>

                        <div className="h-px bg-white/5 w-full"></div>

                        {/* Top Dangerous Section */}
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-4 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                                High Alert Zones
                            </h3>
                            <div className="space-y-3">
                                {data.topDangerous.map((hood, i) => (
                                    <div key={hood.id} className="transform transition-all duration-300 hover:scale-[1.02] hover:-translate-x-1">
                                        <RankingCard neighborhood={hood} rank={i + 1} type="danger" />
                                    </div>
                                ))}
                                {data.topDangerous.length === 0 && <div className="text-xs text-muted-foreground italic">No data available</div>}
                            </div>
                        </div>

                        <div className="h-px bg-white/5 w-full"></div>

                        {/* System Status / Decor */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/5">
                            <div className="flex items-center gap-3 mb-2">
                                <Activity className="h-5 w-5 text-blue-400" />
                                <span className="text-sm font-bold text-white">System Diagnostics</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Data Stream</span>
                                    <span className="text-emerald-400">Stable</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Region Coverage</span>
                                    <span className="text-blue-400">98.5%</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Update Rate</span>
                                    <span className="text-purple-400">Real-time</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
