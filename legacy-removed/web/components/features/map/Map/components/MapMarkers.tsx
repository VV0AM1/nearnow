import { useEffect, useRef } from "react";
import Link from "next/link";
import { Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { Marker as LeafletMarker } from "leaflet";
import { getCategory } from "@/config/categories";
import { clusterIcon, markerIcon } from "../MapConfig";

interface MapMarkersProps {
    posts: Array<{ id: string; title: string; category: string; latitude: number; longitude: number; status?: string; isStale?: boolean }>;
    highlightedPostId?: string | null;
    onSelect?: (id: string) => void;
}

export default function MapMarkers({ posts, highlightedPostId, onSelect }: MapMarkersProps) {
    const map = useMap();
    const refs = useRef<Record<string, LeafletMarker | null>>({});

    // Bring a highlighted post into view without jumping the zoom level around.
    useEffect(() => {
        const marker = highlightedPostId ? refs.current[highlightedPostId] : null;
        if (marker) map.panTo(marker.getLatLng(), { animate: true });
    }, [highlightedPostId, map]);

    return (
        <MarkerClusterGroup chunkedLoading showCoverageOnHover={false} maxClusterRadius={50} spiderfyOnMaxZoom iconCreateFunction={(cluster: { getChildCount: () => number }) => clusterIcon(cluster.getChildCount())}>
            {posts.map((post) => {
                if (!Number.isFinite(post.latitude) || !Number.isFinite(post.longitude)) return null;
                const c = getCategory(post.category);
                return (
                    <Marker
                        key={post.id}
                        position={[post.latitude, post.longitude]}
                        title={`${c.label}: ${post.title}`}
                        alt={`${c.label}: ${post.title}`}
                        icon={markerIcon(c.hex, c.shape, { dim: post.status !== undefined && post.status !== "ACTIVE", highlighted: post.id === highlightedPostId })}
                        zIndexOffset={post.id === highlightedPostId ? 1000 : 0}
                        ref={(el) => {
                            refs.current[post.id] = el;
                        }}
                        eventHandlers={{ click: () => onSelect?.(post.id) }}
                    >
                        {!onSelect ? (
                            <Popup>
                                <div className="w-56 space-y-2 p-3.5">
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                                        <c.icon className="size-3.5" style={{ color: c.hex }} aria-hidden /> {c.label}
                                    </span>
                                    <p className="text-sm font-semibold leading-snug">{post.title}</p>
                                    <Link href={`/post/${post.id}`} className="inline-block text-[13px] font-semibold text-primary">
                                        View post →
                                    </Link>
                                </div>
                            </Popup>
                        ) : null}
                    </Marker>
                );
            })}
        </MarkerClusterGroup>
    );
}
