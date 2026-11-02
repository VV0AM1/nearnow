"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, Check, CheckCheck, ChevronRight, Clock, Settings2, Sparkles, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { briefLines, briefRadius, CHANGE_LABEL, PROVENANCE_LABEL, type Brief, type BriefChange, type SavedArea } from "@/lib/brief";
import { getCategory } from "@/config/categories";
import { Button, Card, Chip, IconButton, Skeleton } from "@/components/nn";
import { cn } from "@/lib/utils";

const CHANGE_ICON: Record<BriefChange, typeof Sparkles> = { NEW: Sparkles, CONFIRMED: Users, RESOLVED: CheckCheck, EXPIRED: Clock };
const PREVIEW = 3;

/**
 * "Since you last checked": deterministic change summary for the followed area.
 * Every line links to its post and carries provenance and freshness.
 */
export function BriefCard({ area, radiusKm, onSettings }: { area: { lat: number; long: number }; radiusKm: number; onSettings: () => void }) {
    const [brief, setBrief] = useState<Brief | null>(null);
    const [areas, setAreas] = useState<SavedArea[]>([]);
    const [areaId, setAreaId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setError(null);
        try {
            const q = areaId ? `areaId=${areaId}` : `latitude=${area.lat}&longitude=${area.long}&radius=${briefRadius(radiusKm)}`;
            const [b, a] = await Promise.all([apiFetch<Brief>(`/brief?${q}`), apiFetch<SavedArea[]>("/brief/areas")]);
            setBrief(b);
            setAreas(a);
        } catch (e) {
            setError(e instanceof Error ? e.message : "The brief could not be loaded.");
        }
    }, [area.lat, area.long, radiusKm, areaId]);

    useEffect(() => {
        void load();
    }, [load]);

    if (!brief && !error) {
        return (
            <Card className="space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </Card>
        );
    }
    if (!brief) {
        return (
            <Card className="flex items-center gap-3 text-sm text-muted-foreground">
                <AlertCircle className="size-5 text-warning" aria-hidden /> The brief could not be loaded. {error}
            </Card>
        );
    }
    if (!brief.enabled) {
        return (
            <Card className="flex items-center gap-3">
                <p className="flex-1 text-[15px] text-muted-foreground">The local brief is turned off.</p>
                <Button
                    size="sm"
                    variant="tinted"
                    onClick={async () => {
                        await apiFetch("/brief/preferences", { method: "PATCH", json: { enabled: true } });
                        void load();
                    }}
                >
                    Turn on
                </Button>
            </Card>
        );
    }

    const lines = briefLines(brief);
    const shown = expanded ? brief.items : brief.items.slice(0, PREVIEW);

    return (
        <Card as="section" className="space-y-4">
            <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                    <Sparkles className="size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="text-[17px] font-semibold">Since you last checked</h2>
                    <p className="text-[13px] text-muted-foreground">Changes since {formatDistanceToNow(new Date(brief.since), { addSuffix: true })}</p>
                </div>
                <IconButton icon={Settings2} label="Brief settings" size="sm" onClick={onSettings} />
            </div>

            {areas.length ? (
                <div className="flex flex-wrap gap-2">
                    <Chip label="Current area" selected={!areaId} onClick={() => setAreaId(null)} />
                    {areas.map((a) => (
                        <Chip key={a.id} label={a.label} selected={areaId === a.id} onClick={() => setAreaId(a.id)} />
                    ))}
                </div>
            ) : null}

            <ul className="space-y-1" aria-live="polite">
                {lines.map((l) => (
                    <li key={l.text} className={cn("flex items-start gap-1.5 text-[15px]", l.warning && "text-warning")}>
                        {l.warning ? <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> : null}
                        {l.text}
                    </li>
                ))}
            </ul>

            {shown.length ? (
                <ul className="divide-y divide-border border-t border-border">
                    {shown.map((item) => {
                        const c = getCategory(item.category);
                        const ChangeIcon = CHANGE_ICON[item.change];
                        const tone = item.change === "RESOLVED" ? "text-success" : item.change === "EXPIRED" ? "text-muted-foreground" : "text-primary";
                        const provenance = item.provenance === "OFFICIAL" && item.sourceName ? `Official: ${item.sourceName}` : PROVENANCE_LABEL[item.provenance];
                        return (
                            <li key={item.postId}>
                                <Link href={`/post/${item.postId}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-surface-2">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: `${c.hex}22` }}>
                                        <c.icon className="size-[18px]" style={{ color: c.hex }} aria-hidden />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="line-clamp-1 block text-[15px] font-medium">{item.title}</span>
                                        <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted-foreground">
                                            <span className={cn("inline-flex items-center gap-1 font-semibold", tone)}>
                                                <ChangeIcon className="size-3.5" aria-hidden /> {CHANGE_LABEL[item.change]}
                                            </span>
                                            · {provenance} · {formatDistanceToNow(new Date(item.at), { addSuffix: true })}
                                            {item.distanceKm ? ` · ${item.distanceKm} km away` : ""}
                                        </span>
                                    </span>
                                    <ChevronRight className="size-4 text-subtle" aria-hidden />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            ) : null}

            <div className="flex items-center justify-between">
                {brief.items.length > PREVIEW ? (
                    <Button variant="plain" size="sm" onClick={() => setExpanded((v) => !v)}>
                        {expanded ? "Show less" : `Show all (${brief.items.length})`}
                    </Button>
                ) : (
                    <span />
                )}
                {brief.items.length ? (
                    <Button
                        variant="tinted"
                        size="sm"
                        icon={Check}
                        loading={busy}
                        onClick={async () => {
                            setBusy(true);
                            try {
                                await apiFetch("/brief/seen", { method: "POST" });
                                setExpanded(false);
                                await load();
                            } finally {
                                setBusy(false);
                            }
                        }}
                    >
                        Mark as read
                    </Button>
                ) : null}
            </div>
        </Card>
    );
}
