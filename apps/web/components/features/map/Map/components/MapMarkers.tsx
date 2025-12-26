import { Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { getCategoryColor } from "../../../feed/CategoryFilter";
import { createCustomIcon, createClusterIcon, createPulseIcon } from "../MapConfig";

interface MapMarkersProps {
    posts: any[];
}

export default function MapMarkers({ posts }: MapMarkersProps) {
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
                    >
                        <Popup className="glass-popup">
                            <div className="p-1 min-w-[150px]">
                                <strong className="block text-sm font-bold mb-1 text-slate-800">{post.title}</strong>
                                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{post.category}</span>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MarkerClusterGroup>
    );
}
