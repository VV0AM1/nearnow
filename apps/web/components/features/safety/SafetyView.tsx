"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Info, Phone } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";
import { AreaChooser } from "@/components/shell/AreaChooser";
import { getCategory } from "@/config/categories";
import { Banner, Card, PageHeader, Segmented, Skeleton } from "@/components/nn";

interface AreaActivity {
    windowDays: number;
    radiusKm: number;
    totalReports: number;
    areas: { id: string | null; name: string; city: string | null; reports: number; resolved: number; byCategory: Record<string, number>; lastReportAt: string | null }[];
    method: string;
    disclaimer: string;
}

/**
 * Recent community posts per neighbourhood. Counts, recency, method and
 * limitations — never a "safest / most dangerous" ranking.
 */
export default function SafetyView() {
    const { location } = useDashboard();
    const [days, setDays] = useState<"1" | "7" | "30">("7");
    const [radius, setRadius] = useState<"2" | "5" | "10" | "25">("5");
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

    if (!location) {
        return (
            <div className="mx-auto max-w-lg">
                <PageHeader title="Area overview" className="mb-6" />
                <Card>
                    <AreaChooser />
                </Card>
            </div>
        );
    }

    const max = Math.max(1, ...(data?.areas.map((a) => a.reports) ?? [1]));

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <PageHeader title="Area overview" subtitle={`What neighbours posted around ${location.label ?? "your chosen area"}.`} />

            <div className="flex flex-wrap gap-2">
                <Segmented
                    label="Period"
                    value={days}
                    onChange={setDays}
                    options={[
                        { value: "1", label: "24 h" },
                        { value: "7", label: "7 days" },
                        { value: "30", label: "30 days" },
                    ]}
                />
                <Segmented
                    label="Distance"
                    value={radius}
                    onChange={setRadius}
                    options={(["2", "5", "10", "25"] as const).map((r) => ({ value: r, label: `${r} km` }))}
                />
            </div>

            {error ? (
                <Banner tone="warning" message={error} />
            ) : !data ? (
                <div className="space-y-3">
                    <Skeleton className="h-24 w-full rounded-[20px]" />
                    <Skeleton className="h-20 w-full rounded-[20px]" />
                    <Skeleton className="h-20 w-full rounded-[20px]" />
                </div>
            ) : (
                <>
                    <Card className="flex items-end justify-between gap-4">
                        <div>
                            <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Posts</p>
                            <p className="mt-1 text-[40px] font-bold leading-none tabular-nums">{data.totalReports}</p>
                        </div>
                        <p className="text-right text-[13px] text-muted-foreground">
                            last {data.windowDays} {data.windowDays === 1 ? "day" : "days"}
                            <br />
                            within {data.radiusKm} km
                        </p>
                    </Card>

                    {data.areas.length === 0 ? (
                        <Card>
                            <p className="text-center text-[15px] text-muted-foreground">No posts in this period.</p>
                        </Card>
                    ) : (
                        <ul className="space-y-3">
                            {data.areas.map((a) => (
                                <li key={a.id ?? a.name}>
                                    <Card className="space-y-3">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <p className="text-[17px] font-semibold">
                                                {a.name}
                                                {a.city ? <span className="font-normal text-muted-foreground"> · {a.city}</span> : null}
                                            </p>
                                            <span className="text-[15px] font-semibold tabular-nums">{a.reports}</span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                                            <div className="h-full rounded-full bg-primary" style={{ width: `${(a.reports / max) * 100}%` }} />
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                                            {Object.entries(a.byCategory).map(([c, n]) => {
                                                const cat = getCategory(c);
                                                return (
                                                    <span key={c} className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                                                        <cat.icon className="size-3.5" style={{ color: cat.hex }} aria-hidden />
                                                        {cat.label} <span className="font-semibold text-foreground">{n}</span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        <p className="text-xs text-subtle">
                                            {a.lastReportAt ? `Latest ${formatDistanceToNow(new Date(a.lastReportAt), { addSuffix: true })}` : ""}
                                            {a.resolved ? ` · ${a.resolved} resolved` : ""}
                                        </p>
                                    </Card>
                                </li>
                            ))}
                        </ul>
                    )}

                    <Card className="space-y-3 text-sm">
                        <p className="flex items-start gap-2.5">
                            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> {data.disclaimer}
                        </p>
                        <p className="text-muted-foreground">
                            <span className="font-semibold text-foreground">How this is counted:</span> {data.method}
                        </p>
                        <a href="tel:112" className="inline-flex items-center gap-2 font-semibold text-danger">
                            <Phone className="size-4" aria-hidden /> Call 112 in an emergency
                        </a>
                    </Card>
                </>
            )}
        </div>
    );
}
