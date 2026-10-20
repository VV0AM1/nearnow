"use client";

import { useEffect, useState } from "react";
import { BarChart3, Info, Loader2, Phone } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";
import AreaPrompt from "@/components/features/home/AreaPrompt";

interface AreaActivity {
    windowDays: number;
    radiusKm: number;
    totalReports: number;
    areas: { id: string | null; name: string; city: string | null; reports: number; resolved: number; byCategory: Record<string, number>; lastReportAt: string | null }[];
    method: string;
    disclaimer: string;
}

const LABELS: Record<string, string> = {
    GENERAL: "Local update",
    EVENT: "Event",
    LOST_FOUND: "Lost & found",
    RECOMMENDATION: "Recommendation",
    SAFETY: "Safety notice",
    CRIME: "Incident",
    DANGER: "Urgent help",
};

/**
 * Recent community posts per area. Replaces the former "safest / most dangerous"
 * ranking, which was computed from raw post counts and could not support any claim
 * about safety. Counts, recency, method and limitations are shown instead.
 */
export default function SafetyView() {
    const { location } = useDashboard();
    const [days, setDays] = useState(7);
    const [radius, setRadius] = useState(5);
    const [data, setData] = useState<AreaActivity | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!location) return;
        setData(null);
        setError(null);
        apiFetch<AreaActivity>(`/neighborhoods/activity?latitude=${location.lat}&longitude=${location.long}&radius=${radius}&days=${days}`)
            .then(setData)
            .catch((e: Error) => setError(e.message));
    }, [location, radius, days]);

    if (!location) return <AreaPrompt />;

    return (
        <div className="min-h-screen lg:h-full lg:overflow-y-auto w-full pt-24 px-4 md:px-8 pb-10 max-w-4xl mx-auto space-y-6">
            <header className="space-y-2">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-primary" /> Area overview
                </h1>
                <p className="text-sm text-muted-foreground">Recent community posts around {location.label ?? "your chosen area"}.</p>
            </header>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Filters">
                {[1, 7, 30].map((d) => (
                    <button key={d} onClick={() => setDays(d)} aria-pressed={days === d} className={`px-3 py-1.5 rounded-full border text-sm ${days === d ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>
                        Last {d} {d === 1 ? "day" : "days"}
                    </button>
                ))}
                {[2, 5, 10, 25].map((r) => (
                    <button key={r} onClick={() => setRadius(r)} aria-pressed={radius === r} className={`px-3 py-1.5 rounded-full border text-sm ${radius === r ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>
                        {r} km
                    </button>
                ))}
            </div>

            {error ? (
                <p role="alert" className="text-red-600">{error}</p>
            ) : !data ? (
                <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
                <>
                    <p className="font-semibold">
                        {data.totalReports} posts in the last {data.windowDays} days within {data.radiusKm} km
                    </p>
                    {data.areas.length === 0 && <p className="text-muted-foreground">No posts in this period.</p>}
                    <ul className="space-y-3">
                        {data.areas.map((a) => (
                            <li key={a.id ?? a.name} className="rounded-xl border border-border p-4 space-y-1">
                                <p className="font-bold">
                                    {a.name} {a.city && <span className="font-normal text-muted-foreground">· {a.city}</span>}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {Object.entries(a.byCategory).map(([c, n]) => `${LABELS[c] ?? c}: ${n}`).join(" · ")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {a.lastReportAt ? `Latest ${new Date(a.lastReportAt).toLocaleString()}` : ""}
                                    {a.resolved ? ` · ${a.resolved} resolved` : ""}
                                </p>
                            </li>
                        ))}
                    </ul>
                    <section className="rounded-xl border border-border p-4 space-y-3 text-sm">
                        <p className="flex items-start gap-2"><Info className="h-4 w-4 mt-0.5 shrink-0" /> {data.disclaimer}</p>
                        <p className="text-muted-foreground"><strong>How this is counted:</strong> {data.method}</p>
                        <a href="tel:112" className="inline-flex items-center gap-2 font-bold text-red-600"><Phone className="h-4 w-4" /> Call 112 in an emergency</a>
                    </section>
                </>
            )}
        </div>
    );
}
