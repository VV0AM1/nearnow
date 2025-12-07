"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

export default function MapLoader({ posts, center, radius, onMapClick }: { posts: any[], center?: { lat: number; long: number }, radius?: number, onMapClick?: (lat: number, long: number) => void }) {
    const Map = useMemo(() => dynamic(
        () => import("./Map"),
        {
            loading: () => <div className="h-full w-full bg-muted/50 animate-pulse rounded-xl flex items-center justify-center text-muted-foreground">Loading Map...</div>,
            ssr: false
        }
    ), []);

    const mapCenter: [number, number] | undefined = center ? [center.lat, center.long] : undefined;

    return <Map posts={posts} center={mapCenter} radius={radius} onMapClick={onMapClick} />;
}
