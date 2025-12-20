"use client";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useFeed } from "../../hooks/useFeed";
import MapLoader from "../../components/features/map/MapLoader";
import { useGeoLocation } from "../../hooks/useGeoLocation";

export default function MapPage() {
    const { location } = useGeoLocation();
    const feedLoc = { lat: location.latitude || 37.7749, long: location.longitude || -122.4194 };
    const { posts } = useFeed(feedLoc, 50); // Wider radius for map view

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-border shadow-lg relative bg-[#0a0a0a]">
                <MapLoader posts={posts} center={feedLoc} radius={50} />

                <div className="absolute top-4 left-4 z-[400] bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg pointer-events-none">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">Explore</h1>
                    <p className="text-zinc-400 text-sm">Discover alerts around you</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
