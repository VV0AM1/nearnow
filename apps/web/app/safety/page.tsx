"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { API_URL } from "@/lib/config";
import { useGeoLocation } from "../../hooks/useGeoLocation";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { RankingCard } from "../../components/features/safety/RankingCard";
import { SafetyLeaderboard } from "../../components/features/safety/SafetyLeaderboard";

export default function SafetyPage() {
    const { location } = useGeoLocation();
    const [stats, setStats] = useState<any[]>([]);
    const [radius, setRadius] = useState(5);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!location.latitude || !location.longitude) return;

        setLoading(true);
        fetch(`${API_URL}/neighborhoods/stats?lat=${location.latitude}&lng=${location.longitude}&radius=${radius}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setStats(data);
                } else {
                    console.error("API Error or Invalid Format:", data);
                    setStats([]); // Fallback to empty
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setStats([]);
                setLoading(false);
            });
    }, [location.latitude, location.longitude, radius]);

    // Derived Lists
    const safest = stats.slice(0, 3);
    const dangerous = [...stats].reverse().slice(0, 3);

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-12">

                {/* Header & Controls */}
                <div className="text-center space-y-6">
                    <div>
                        <h1 className="text-5xl font-black bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                            Safety Command Center
                        </h1>
                        <p className="text-zinc-400 text-lg max-w-2xl mx-auto mt-2">
                            Real-time safety analytics within <span className="text-white font-bold">{radius}km</span> of your position.
                        </p>
                    </div>

                    {/* Radius Slider */}
                    <div className="max-w-md mx-auto bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <label className="flex justify-between text-sm font-medium mb-4 text-zinc-300">
                            <span>Analysis Radius</span>
                            <span className="text-blue-400">{radius} km</span>
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            step="1"
                            value={radius}
                            onChange={(e) => setRadius(parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between text-xs text-zinc-500 mt-2">
                            <span>1km</span>
                            <span>50km</span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-zinc-500 animate-pulse">Calculating safety scores...</div>
                ) : stats.length === 0 ? (
                    <div className="text-center py-20 text-zinc-500">
                        No neighborhoods found nearby. Try increasing the radius.
                    </div>
                ) : (
                    <>
                        {/* Top Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <section className="space-y-6">
                                <div className="flex items-center gap-2 text-emerald-400 mb-6">
                                    <span className="text-2xl">🛡️</span>
                                    <h2 className="text-2xl font-bold">Top 3 Safest Zones</h2>
                                </div>
                                <div className="space-y-4">
                                    {safest.map((hood, i) => (
                                        <RankingCard key={hood.id} neighborhood={hood} rank={i + 1} type="safe" />
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center gap-2 text-red-400 mb-6">
                                    <span className="text-2xl">🚨</span>
                                    <h2 className="text-2xl font-bold">High Attention Zones</h2>
                                </div>
                                <div className="space-y-4">
                                    {dangerous.map((hood, i) => (
                                        <RankingCard key={hood.id} neighborhood={hood} rank={i + 1} type="danger" />
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Full Leaderboard */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-6">Local Safety Index</h2>
                            <SafetyLeaderboard data={stats} />
                        </section>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
