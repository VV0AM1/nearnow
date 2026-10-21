"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, Inbox, Maximize2, Plus, SearchX } from "lucide-react";
import MapLoader from "../map/MapLoader";
import { useFeed } from "../../../hooks/useFeed";
import { useMapPosts } from "../../../hooks/useMapPosts";
import { useDashboard } from "../../../context/DashboardContext";
import { useAuthContext } from "@/context/AuthContext";
import { CATEGORIES } from "@/config/categories";
import { Banner, Button, Card, Chip, EmptyState, Segmented } from "@/components/nn";
import { Reveal } from "@/components/motion";
import { useShell } from "@/components/shell/AppShell";
import { PostCard, PostCardSkeleton } from "./PostCard";
import { AreaHero } from "./AreaHero";
import { BriefCard } from "../brief/BriefCard";
import type { Post } from "./Post/Post.types";

const RADII = ["1", "2", "5", "10", "25"] as const;
const PAGE_SIZE = 10;

export default function FeedContainer({ initialPosts = [] }: { initialPosts?: Array<{ id: string; title: string; content: string; createdAt: string }> }) {
    const { location, searchQuery } = useDashboard();
    const { user } = useAuthContext();
    const { openCreate } = useShell();
    const router = useRouter();
    const [radius, setRadius] = useState<(typeof RADII)[number]>("5");
    const [category, setCategory] = useState<string>("ALL");
    const [highlighted, setHighlighted] = useState<string | null>(null);

    const km = Number(radius);
    const { posts, loading, error, nextPage, prevPage, hasMore, page } = useFeed(location, km, [category], initialPosts, PAGE_SIZE, searchQuery);
    const { posts: mapPosts } = useMapPosts(location, km);
    const first = loading && posts.length === 0;
    const nextRadius = RADII.find((r) => Number(r) > km);

    return (
        <div className="space-y-8">
            {location ? <AreaHero name={user?.name} area={location} radiusKm={km} posts={mapPosts as Post[]} /> : null}

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 space-y-6">
                    {location && !searchQuery ? (
                        <Reveal>
                            <BriefCard area={location} radiusKm={km} onSettings={() => router.push("/profile#brief")} />
                        </Reveal>
                    ) : null}

                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="font-mono text-[12px] uppercase tracking-wider text-muted-foreground">The feed</p>
                            <h2 className="display text-[32px] leading-none">Community updates</h2>
                        </div>
                        <Segmented label="Distance" value={radius} onChange={setRadius} options={RADII.map((r) => ({ value: r, label: `${r} km` }))} />
                    </div>

                    <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide max-sm:mask-fade-x sm:mx-0 sm:px-0">
                        <div className="flex w-max gap-2 pb-1 sm:w-auto sm:flex-wrap">
                            {CATEGORIES.map((c) => (
                                <Chip key={c.id} label={c.label} icon={c.id === "ALL" ? undefined : c.icon} color={c.hex} selected={category === c.id} onClick={() => setCategory(c.id)} />
                            ))}
                        </div>
                    </div>
                    {searchQuery ? <p className="text-[13px] text-muted-foreground">Results for “{searchQuery}”</p> : null}

                    {error ? <Banner tone="warning" message={error} /> : null}

                    {first ? (
                        <div className="space-y-5">
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
                        <div className="space-y-5">
                            {(posts as Post[]).map((post, i) => (
                                <Reveal key={post.id} delay={Math.min(i, 5) * 0.06}>
                                    <PostCard post={post} onHover={setHighlighted} />
                                </Reveal>
                            ))}
                        </div>
                    )}

                    {page > 1 || hasMore ? (
                        <nav aria-label="Pages" className="flex items-center justify-between pt-2">
                            <Button variant="outline" size="sm" icon={ChevronLeft} onClick={prevPage} disabled={page <= 1 || loading}>
                                Newer
                            </Button>
                            <span className="font-mono text-[12px] text-muted-foreground">Page {page}</span>
                            <Button variant="outline" size="sm" onClick={nextPage} disabled={!hasMore || loading}>
                                Older <ChevronRight className="size-4" aria-hidden />
                            </Button>
                        </nav>
                    ) : null}
                </div>

                {/* Right rail: the real map */}
                <aside className="hidden xl:block" aria-label="Map">
                    <div className="sticky top-24 space-y-4">
                        <div className="overflow-hidden rounded-[28px] shadow-[var(--shadow-deep)] ring-1 ring-border">
                            <div className="relative h-[420px]">
                                {location ? <MapLoader posts={mapPosts} center={location} radius={km} highlightedPostId={highlighted} /> : null}
                                <Link href="/map" className="material absolute right-3 top-3 z-[500] inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold shadow-[var(--shadow-float)] ring-1 ring-border">
                                    <Maximize2 className="size-4" aria-hidden /> Open map
                                </Link>
                            </div>
                        </div>
                        <Link href="/safety" className="group flex items-center justify-between rounded-[22px] bg-ink px-5 py-4 text-paper shadow-[var(--shadow-float)]">
                            <span>
                                <span className="block font-mono text-[11px] uppercase tracking-wider opacity-60">Area overview</span>
                                <span className="display block text-[19px]">What neighbours posted, by place</span>
                            </span>
                            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
                        </Link>
                    </div>
                </aside>
            </div>
        </div>
    );
}
