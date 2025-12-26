import { useEffect, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { getCategoryColor } from "../../../feed/CategoryFilter";
import { createCustomIcon, createClusterIcon, createPulseIcon } from "../MapConfig";

interface MapMarkersProps {
    posts: any[];
    highlightedPostId?: string | null;
}

export default function MapMarkers({ posts, highlightedPostId }: MapMarkersProps) {
    const markerRefs = useRef<{ [key: string]: any }>({});

    // Effect to handle highlighting
    useEffect(() => {
        if (highlightedPostId && markerRefs.current[highlightedPostId]) {
            const marker = markerRefs.current[highlightedPostId];
            marker.openPopup();
        } else {
            // Optional: Close all popups when nothing is highlighted? 
            // Or just leave them alone. User might have clicked one.
            // If we really want "peak" behavior, we should probably close them.
            // But Leaflet single popup behavior might handle it if we just open.
        }
    }, [highlightedPostId]);


    return (
        <MarkerClusterGroup
            chunkedLoading
            showCoverageOnHover={false}
            maxClusterRadius={60}
            spiderfyOnMaxZoom={true}
            iconCreateFunction={(cluster) => createClusterIcon(cluster.getChildCount())}
        >
            {posts.map((post) => {
                if (!post.latitude || !post.longitude) return null;
                const colorClass = getCategoryColor(post.category);
                const isDanger = post.category === 'DANGER';

                return (
                    <Marker
                        key={post.id}
                        position={[post.latitude, post.longitude]}
                        icon={isDanger ? createPulseIcon() : createCustomIcon(colorClass)}
                        ref={(el) => { markerRefs.current[post.id] = el; }}
                    >
                        <Popup className="glass-popup">
                            <div className="p-2 min-w-[160px]">
                                <strong className="block text-sm font-bold mb-2 text-white/90 tracking-wide">{post.title}</strong>
                                <span className={`text-[10px] ${colorClass} text-white px-2 py-0.5 rounded-full font-bold shadow-sm ring-1 ring-white/10 uppercase tracking-wider`}>
                                    {post.category}
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MarkerClusterGroup>
    );
}
