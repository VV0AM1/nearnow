"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { Info } from "lucide-react";
import { IsoCity, type IsoPin } from "@/components/scene/IsoCity";
import { CountUp, PointerStage, Depth } from "@/components/motion";
import { getCategory } from "@/config/categories";
import type { Post } from "./Post/Post.types";

/** Places posts on the diorama relative to the area centre (stylised, not to scale). */
function toPins(posts: Post[], center: { lat: number; long: number }, radiusKm: number): IsoPin[] {
    const kmPerDegLat = 111.32;
    const kmPerDegLng = 111.32 * Math.cos((center.lat * Math.PI) / 180);
    const raw = posts.slice(0, 12).map((p) => ({
        p,
        dx: ((p.longitude - center.long) * kmPerDegLng) / (2 * radiusKm),
        dy: ((p.latitude - center.lat) * kmPerDegLat) / (2 * radiusKm),
    }));
    // Spread clustered posts across the diorama (relative positions kept; scale is illustrative).
    const spread = Math.max(0.05, ...raw.map((r) => Math.max(Math.abs(r.dx), Math.abs(r.dy))));
    const k = spread < 0.36 ? 0.36 / spread : 1;
    const clamp = (v: number) => Math.min(0.9, Math.max(0.1, v));
    return raw.map(({ p, dx, dy }) => ({ id: p.id, x: clamp(0.5 + dx * k), y: clamp(0.5 - dy * k), category: p.category, label: p.title }));
}

function greeting(now: Date) {
    const h = now.getHours();
    return h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 19 ? "Good afternoon" : "Good evening";
}

/** Feed header: greeting, a live 3D diorama of the area, and honest activity counts. */
export function AreaHero({ name, area, radiusKm, posts }: { name?: string | null; area: { lat: number; long: number; label?: string }; radiusKm: number; posts: Post[] }) {
    const router = useRouter();
    const now = new Date();
    const active = useMemo(() => posts.filter((p) => !p.status || p.status === "ACTIVE"), [posts]);
    const pins = useMemo(() => toPins(active, area, radiusKm), [active, area, radiusKm]);
    const byCategory = useMemo(() => {
        const m = new Map<string, number>();
        for (const p of active) m.set(p.category, (m.get(p.category) ?? 0) + 1);
        return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    }, [active]);
    const latest = active.reduce<string | null>((acc, p) => (!acc || p.createdAt > acc ? p.createdAt : acc), null);

    return (
        <section aria-label="Your area" className="relative overflow-hidden rounded-[32px] bg-surface shadow-[var(--shadow-deep)] ring-1 ring-border">
            <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-[380px] rounded-full bg-primary/12 blur-[90px]" />
            <div aria-hidden className="pointer-events-none absolute -bottom-24 right-10 size-[300px] rounded-full bg-signal/12 blur-[90px]" />
            <div className="relative grid items-center gap-2 lg:grid-cols-[1fr_1.1fr]">
                <div className="space-y-5 p-6 sm:p-8">
                    <p className="font-mono text-[12px] uppercase tracking-wider text-muted-foreground">
                        {format(now, "EEE d MMM · HH:mm")} · {area.lat.toFixed(3)}°, {area.long.toFixed(3)}°
                    </p>
                    <h1 className="display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[0.98]">
                        {greeting(now)}
                        {name ? `, ${name.split(" ")[0]}` : ""}.
                        <span className="ink-gradient block">Here’s {area.label ?? "your area"}.</span>
                    </h1>
                    <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
                        <div>
                            <p className="display text-[52px] leading-none">
                                <CountUp value={active.length} />
                            </p>
                            <p className="mt-1 text-[13px] text-muted-foreground">
                                active posts within {radiusKm} km{latest ? ` · latest ${formatDistanceToNow(new Date(latest), { addSuffix: true })}` : ""}
                            </p>
                        </div>
                        {byCategory.length ? (
                            <ul className="flex flex-wrap gap-2">
                                {byCategory.map(([id, n]) => {
                                    const c = getCategory(id);
                                    return (
                                        <li key={id} className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-[13px] font-semibold">
                                            <c.icon className="size-3.5" style={{ color: c.hex }} aria-hidden />
                                            {c.label}
                                            <span className="font-mono text-muted-foreground">{n}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : null}
                    </div>
                    <p className="flex items-center gap-1.5 text-[12px] text-subtle">
                        <Info className="size-3.5" aria-hidden /> Counts what neighbours posted — not a safety rating.
                    </p>
                </div>
                <PointerStage className="relative h-[320px] sm:h-[400px]">
                    <Depth depth={-12} className="absolute inset-0 flex items-center justify-center">
                        <IsoCity
                            pins={pins}
                            tiles={9}
                            seed={Math.round(Math.abs(area.lat * 1000 + area.long * 100)) || 7}
                            className="scale-[0.6] sm:scale-[0.78] xl:scale-[0.86]"
                            onSelect={(id) => router.push(`/post/${id}`)}
                            label={`Illustrative view of ${area.label ?? "your area"} with ${pins.length} posts`}
                        />
                    </Depth>
                    <span className="absolute bottom-4 right-5 rounded-full bg-surface/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">Illustrative layout · positions approximate</span>
                </PointerStage>
            </div>
        </section>
    );
}
