"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, Inbox, X } from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useMapPosts } from "../../hooks/useMapPosts";
import MapLoader from "../../components/features/map/MapLoader";
import { useDashboard } from "../../context/DashboardContext";
import { AreaChooser } from "@/components/shell/AreaChooser";
import { CATEGORIES, getCategory } from "@/config/categories";
import { Banner, Button, Card, Chip, EmptyState, IconButton, Segmented } from "@/components/nn";
import { CategoryDot } from "@/components/features/feed/PostCard";
import { CategoryBadge, TrustLine } from "@/components/features/feed/PostStatus";
import type { Post } from "@/components/features/feed/Post/Post.types";
import { cn } from "@/lib/utils";

const RADII = ["2", "5", "10", "25"] as const;
const TIMES = [
    ["24h", "24 h"],
    ["7d", "7 days"],
    ["all", "Any time"],
] as const;

function MapScreen() {
    const { location } = useDashboard();
    const params = useSearchParams();
    const [radius, setRadius] = useState<(typeof RADII)[number]>("5");
    const [category, setCategory] = useState("ALL");
    const [since, setSince] = useState<(typeof TIMES)[number][0]>("7d");
    const [selectedId, setSelectedId] = useState<string | null>(params.get("focus"));
    const [mobileView, setMobileView] = useState<"map" | "list">("map");
    const { posts, error } = useMapPosts(location, Number(radius));
    // This boundary hydrates after the saved area loads from storage; render the same
    // placeholder on the server and the first client pass to avoid a mismatch.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const focus = useMemo(() => {
        const lat = Number(params.get("lat"));
        const long = Number(params.get("lng"));
        return params.get("focus") && Number.isFinite(lat) && Number.isFinite(long) ? { lat, long } : null;
    }, [params]);

    const visible = useMemo(() => {
        const cutoff = since === "24h" ? Date.now() - 864e5 : since === "7d" ? Date.now() - 7 * 864e5 : 0;
        return (posts as Post[]).filter((p) => (category === "ALL" || p.category === category) && new Date(p.createdAt).getTime() >= cutoff);
    }, [posts, category, since]);
    const selected = visible.find((p) => p.id === selectedId) ?? (posts as Post[]).find((p) => p.id === selectedId) ?? null;

    if (!mounted) return <div className="h-[calc(100dvh-11.5rem)] animate-pulse rounded-[28px] bg-surface-2 lg:h-[calc(100dvh-5.75rem)]" aria-label="Loading map" />;
    if (!location) {
        return (
            <div className="mx-auto max-w-lg px-4 py-10">
                <h1 className="mb-6 text-[28px] font-bold tracking-tight">Choose an area to explore</h1>
                <Card>
                    <AreaChooser />
                </Card>
            </div>
        );
    }

    const panel = (
        <div className="flex h-full flex-col">
            <div className="space-y-3 border-b border-border p-4">
                <div className="flex items-baseline justify-between">
                    <h1 className="display text-[30px] leading-none">Map</h1>
                    <span className="text-[13px] text-muted-foreground">
                        {visible.length} post{visible.length === 1 ? "" : "s"}
                    </span>
                </div>
                <div className="mask-fade-x -mx-4 overflow-x-auto px-4 scrollbar-hide">
                    <div className="flex w-max gap-2">
                        {CATEGORIES.map((c) => (
                            <Chip key={c.id} label={c.label} icon={c.id === "ALL" ? undefined : c.icon} color={c.hex} selected={category === c.id} onClick={() => setCategory(c.id)} />
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Segmented label="Distance" value={radius} onChange={setRadius} options={RADII.map((r) => ({ value: r, label: `${r} km` }))} />
                    <Segmented label="Time" value={since} onChange={setSince} options={TIMES.map(([v, l]) => ({ value: v, label: l }))} />
                </div>
            </div>

            {selected ? (
                <div className="space-y-3 border-b border-border bg-primary-soft/40 p-4">
                    <div className="flex items-center justify-between">
                        <CategoryBadge category={selected.category} />
                        <IconButton icon={X} label="Close" size="sm" onClick={() => setSelectedId(null)} />
                    </div>
                    <p className="text-[17px] font-semibold leading-snug">{selected.title}</p>
                    <TrustLine post={selected} />
                    <Button href={`/post/${selected.id}`} size="sm">
                        View details
                    </Button>
                </div>
            ) : null}

            <div className="custom-scrollbar flex-1 overflow-y-auto">
                {error ? (
                    <div className="p-4">
                        <Banner tone="warning" message="Could not load posts for this area. Check your connection and refresh." />
                    </div>
                ) : visible.length === 0 ? (
                    <EmptyState icon={Inbox} title="No posts with these filters" body="Try a larger distance or a longer time range." />
                ) : (
                    <ul className="divide-y divide-border">
                        {visible.map((p) => (
                            <li key={p.id}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedId(p.id);
                                        setMobileView("map");
                                    }}
                                    aria-current={p.id === selectedId || undefined}
                                    className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2", p.id === selectedId && "bg-primary-soft")}
                                >
                                    <CategoryDot category={p.category} />
                                    <span className="min-w-0 flex-1">
                                        <span className="line-clamp-2 block text-[15px] font-medium leading-snug">{p.title}</span>
                                        <span className="mt-0.5 block text-[13px] text-muted-foreground">
                                            {getCategory(p.category).label} · {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                                        </span>
                                    </span>
                                    <ChevronRight className="size-4 text-subtle" aria-hidden />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {posts.length >= 100 ? <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">Showing the 100 most recent. Filter or reduce the distance to see others.</p> : null}
        </div>
    );

    return (
        <div className="flex h-[calc(100dvh-11.5rem-env(safe-area-inset-bottom))] flex-col overflow-hidden rounded-[28px] bg-surface shadow-[var(--shadow-deep)] ring-1 ring-border lg:h-[calc(100dvh-5.75rem)] lg:flex-row">
            <div className="flex justify-center border-b border-border p-2 lg:hidden">
                <Segmented
                    label="View"
                    value={mobileView}
                    onChange={setMobileView}
                    className="w-full max-w-xs"
                    options={[
                        { value: "map", label: "Map" },
                        { value: "list", label: `List (${visible.length})` },
                    ]}
                />
            </div>
            <section aria-label="Posts" className={cn("w-full shrink-0 bg-surface lg:block lg:w-[380px] lg:border-r lg:border-border", mobileView === "list" ? "min-h-0 flex-1" : "hidden")}>
                {panel}
            </section>
            <div className={cn("relative min-h-0 flex-1", mobileView === "list" && "hidden lg:block")}>
                <MapLoader posts={visible} center={focus ?? location} radius={Number(radius)} highlightedPostId={selectedId} onSelectPost={setSelectedId} showZoom zoom={focus ? 16 : 13} />
                {selected ? (
                    <div className="absolute inset-x-3 bottom-3 z-10 lg:hidden">
                        <Card className="space-y-2 shadow-[var(--shadow-float)]">
                            <div className="flex items-center justify-between">
                                <CategoryBadge category={selected.category} />
                                <IconButton icon={X} label="Close" size="sm" onClick={() => setSelectedId(null)} />
                            </div>
                            <Link href={`/post/${selected.id}`} className="block text-[17px] font-semibold leading-snug">
                                {selected.title}
                            </Link>
                            <TrustLine post={selected} />
                        </Card>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default function MapPage() {
    return (
        <DashboardLayout fullBleed>
            <Suspense>
                <MapScreen />
            </Suspense>
        </DashboardLayout>
    );
}
