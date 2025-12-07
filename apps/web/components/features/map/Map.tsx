import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { CATEGORIES, getCategoryColor } from "../feed/CategoryFilter";

// Helper to update map view when center prop changes
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, {
            animate: true,
            duration: 1.5 // Smoother animation
        });
    }, [center, zoom, map]);
    return null;
}

// Custom Marker Icon Generator
const createCustomIcon = (colorClass: string) => {
    // extract color from tailwind class name logic or just hardcode map
    // quick map for now
    let color = "#3b82f6"; // blue default
    if (colorClass.includes("red")) color = "#ef4444";
    if (colorClass.includes("green")) color = "#22c55e";
    if (colorClass.includes("yellow")) color = "#eab308";
    if (colorClass.includes("purple")) color = "#a855f7";
    if (colorClass.includes("pink")) color = "#ec4899";
    if (colorClass.includes("slate")) color = "#64748b";

    return L.divIcon({
        className: "custom-marker",
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 4px rgba(255,255,255,0.2), 0 0 10px ${color};"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
        popupAnchor: [0, -10],
    });
};

// User Location Icon
const userIcon = L.divIcon({
    className: "user-marker",
    html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px #3b82f6;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

// Click Handler Component
function MapEvents({ onClick }: { onClick: (lat: number, long: number) => void }) {
    useMapEvents({
        click(e) {
            onClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

interface MapProps {
    posts: any[];
    center?: [number, number];
    zoom?: number;
    radius?: number; // km
    onMapClick?: (lat: number, long: number) => void;
}

export default function Map({ posts, center = [37.7749, -122.4194], zoom = 13, radius = 10, onMapClick }: MapProps) {
    return (
        <div className="h-full w-full rounded-xl overflow-hidden shadow-lg border border-border relative group">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: "100%", width: "100%" }}
                className="z-0 bg-[#1a1a1a]"
            >
                <ChangeView center={center} zoom={zoom} />
                {onMapClick && <MapEvents onClick={onMapClick} />}

                {/* Dark Matter Tiles */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* Radius Circle */}
                <Circle
                    center={center}
                    radius={radius * 1000} // convert km to meters
                    pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1, dashArray: '5, 10' }}
                />

                {/* User Location Marker - Only show if NO manual picker is active or if explicit center matches user? 
                    Actually always show it as reference. */}
                <Marker position={center} icon={userIcon} zIndexOffset={1000}>
                    <Popup className="glass-popup">
                        <span className="text-xs font-bold">{onMapClick ? "Selected Location" : "You are here"}</span>
                    </Popup>
                </Marker>

                {/* Post Markers */}
                {posts.map((post) => {
                    if (!post.latitude || !post.longitude) return null;
                    const colorClass = getCategoryColor(post.category);
                    return (
                        <Marker
                            key={post.id}
                            position={[post.latitude, post.longitude]}
                            icon={createCustomIcon(colorClass)}
                        >
                            <Popup className="glass-popup">
                                <div className="p-1 min-w-[150px]">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`w-2 h-2 rounded-full ${colorClass}`}></span>
                                        <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">{post.category}</span>
                                    </div>
                                    <strong className="block text-sm font-bold leading-tight mb-1">{post.title}</strong>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                                    <div className="mt-2 pt-2 border-t border-border flex justify-between text-[10px] text-muted-foreground">
                                        <span>{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Overlay Gradient for nicer edge blending */}
            <div className="absolute inset-0 pointer-events-none rounded-xl ring-1 ring-white/10"></div>
        </div>
    );
}
