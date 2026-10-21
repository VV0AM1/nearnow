"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, ChevronLeft, ChevronRight, Inbox, Maximize2, Plus, SearchX } from "lucide-react";
import MapLoader from "../map/MapLoader";
import { useFeed } from "../../../hooks/useFeed";
import { useMapPosts } from "../../../hooks/useMapPosts";
import { useDashboard } from "../../../context/DashboardContext";
import { CATEGORIES, getCategory } from "@/config/categories";
import { Banner, Button, Card, Chip, EmptyState, PageHeader, Segmented } from "@/components/nn";
import { useShell } from "@/components/shell/AppShell";
import { PostCard, PostCardSkeleton } from "./PostCard";
import { BriefCard } from "../brief/BriefCard";
import { useRouter } from "next/navigation";
import type { Post } from "./Post/Post.types";

const RADII = ["1", "2", "5", "10", "25"] as const;
const PAGE_SIZE = 10;

export default function FeedContainer({ initialPosts = [] }: { initialPosts?: Array<{ id: string; title: string; content: string; createdAt: string }> }) {
    const { location, searchQuery } = useDashboard();
    const { openCreate, openAreaPicker } = useShell();
    const router = useRouter();
    const [radius, setRadius] = useState<(typeof RADII)[number]>("5");
    const [category, setCategory] = useState<string>("ALL");
    const [highlighted, setHighlighted] = useState<string | null>(null);

    const km = Number(radius);
    const { posts, loading, error, nextPage, prevPage, hasMore, page } = useFeed(location, km, [category], initialPosts, PAGE_SIZE, searchQuery);
    const { posts: mapPosts } = useMapPosts(location, km);
    const first = loading && posts.length === 0;

    const summary = useMemo(() => {
        const active = (mapPosts as Post[]).filter((p) => !p.status || p.status === "ACTIVE");
        const byCategory = new Map<string, number>();
        for (const p of active) byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1);
        const latest = active.reduce<string | null>((acc, p) => (!acc || p.createdAt > acc ? p.createdAt : acc), null);
        return { total: active.length, byCategory: [...byCategory.entries()].sort((a, b) => b[1] - a[1]), latest };
    }, [mapPosts]);

    const nextRadius = RADII.find((r) => Number(r) > km);

    return (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-5">
                <PageHeader
                    title="Community updates"
                    subtitle={
                        <>
                            Near <button onClick={openAreaPicker} className="font-semibold text-primary hover:underline">{location?.label ?? "your area"}</button> · each post shows when it was posted and whether others confirmed it
                        </>
                    }
                    actions={
                        <Button icon={Plus} onClick={openCreate} className="hidden sm:inline-flex lg:hidden">
                            New post
                        </Button>
                    }
                />

                {location && !searchQuery ? <BriefCard area={location} radiusKm={km} onSettings={() => router.push("/profile#brief")} /> : null}

                {/* Filters */}
                <div className="space-y-3">
                    <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide max-sm:mask-fade-x sm:mx-0 sm:px-0">
                        <div className="flex w-max gap-2 pb-1 sm:w-auto sm:flex-wrap">
                            {CATEGORIES.map((c) => (
                                <Chip key={c.id} label={c.label} icon={c.id === "ALL" ? undefined : c.icon} color={c.hex} selected={category === c.id} onClick={() => setCategory(c.id)} />
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Segmented label="Distance" value={radius} onChange={setRadius} options={RADII.map((r) => ({ value: r, label: `${r} km` }))} />
                        {searchQuery ? <span className="text-[13px] text-muted-foreground">Results for “{searchQuery}”</span> : null}
                    </div>
                </div>

                {error ? <Banner tone="warning" message={error} /> : null}

                {first ? (
                    <div className="space-y-4">
                        <PostCardSkeleton />
                        <PostCardSkeleton />
                        <PostCardSkeleton />
                    </div>
                ) : posts.length === 0 ? (
                    <Card>
                        {searchQuery ? (
                            <EmptyState icon={SearchX} title={`No posts match “${searchQuery}”`} body="Try other words or a larger distance." />
                        ) : (
                            <EmptyState
                                icon={Inbox}
                                title={page > 1 ? "You've reached the end" : "Nothing reported here yet"}
                                body="No posts match in this area. Try a larger distance, another area, or share something useful."
                                action={
                                    <>
                                        {nextRadius ? (
                                            <Button variant="tinted" onClick={() => setRadius(nextRadius)}>
                                                Show {nextRadius} km
                                            </Button>
                                        ) : null}
                                        <Button icon={Plus} onClick={openCreate}>
                                            Post an update
                                        </Button>
                                    </>
                                }
                            />
                        )}
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {(posts as Post[]).map((post) => (
                            <PostCard key={post.id} post={post} onHover={setHighlighted} />
                        ))}
                    </div>
                )}

                {page > 1 || hasMore ? (
                    <nav aria-label="Pages" className="flex items-center justify-between pt-2">
                        <Button variant="outline" size="sm" icon={ChevronLeft} onClick={prevPage} disabled={page <= 1 || loading}>
                            Newer
                        </Button>
                        <span className="text-[13px] text-muted-foreground">Page {page}</span>
                        <Button variant="outline" size="sm" onClick={nextPage} disabled={!hasMore || loading}>
                            Older <ChevronRight className="size-4" aria-hidden />
                        </Button>
                    </nav>
                ) : null}
            </div>

            {/* Right rail */}
            <aside className="hidden space-y-5 xl:block" aria-label="Area">
                <div className="sticky top-24 space-y-5">
                    <Card padded={false} className="overflow-hidden">
                        <div className="relative h-[280px]">
                            {location ? <MapLoader posts={mapPosts} center={location} radius={km} highlightedPostId={highlighted} /> : null}
                            <Link href="/map" className="material absolute right-3 top-3 z-[500] inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-[13px] font-semibold shadow-[var(--shadow-float)]">
                                <Maximize2 className="size-4" aria-hidden /> Open map
                            </Link>
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">This area · {km} km</h2>
                        <p className="mt-2 text-[34px] font-bold leading-none tabular-nums">{summary.total}</p>
                        <p className="mt-1 text-[13px] text-muted-foreground">
                            active posts{summary.latest ? ` · latest ${formatDistanceToNow(new Date(summary.latest), { addSuffix: true })}` : ""}
                        </p>
                        {summary.byCategory.length ? (
                            <ul className="mt-4 space-y-2.5">
                                {summary.byCategory.map(([id, n]) => {
                                    const c = getCategory(id);
                                    return (
                                        <li key={id} className="flex items-center gap-3 text-sm">
                                            <c.icon className="size-4 shrink-0" style={{ color: c.hex }} aria-hidden />
                                            <span className="flex-1">{c.label}</span>
                                            <span className="font-semibold tabular-nums">{n}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : null}
                        <p className="mt-4 text-xs text-subtle">Counts what people posted. It is not a safety rating.</p>
                        <Link href="/safety" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                            Area overview <ArrowRight className="size-4" aria-hidden />
                        </Link>
                    </Card>
                </div>
            </aside>
        </div>
    );
}
