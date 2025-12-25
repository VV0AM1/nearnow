"use client";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useMapPosts } from "../../hooks/useMapPosts";
import MapLoader from "../../components/features/map/MapLoader";
import { useGeoLocation } from "../../hooks/useGeoLocation";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function MapPage() {
    const { location, isLoading: isLocating } = useGeoLocation();
    const [feedLoc, setFeedLoc] = useState<{ lat: number; long: number } | null>(null);

    useEffect(() => {
        if (location.latitude && location.longitude) {
            setFeedLoc({ lat: location.latitude, long: location.longitude });
        }
    }, [location.latitude, location.longitude]);

    // Use a default location ONLY if we timeout or error, but initially wait for real location
    // San Francisco fallback
    const defaultLoc = { lat: 37.7749, long: -122.4194 };
    const center = feedLoc || defaultLoc;

    const { posts } = useMapPosts(center, 50);

    // Show loading screen until we have location (or timeout)
    const showLoading = isLocating && !feedLoc;

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-border shadow-lg relative bg-[#0a0a0a]">

                {showLoading ? (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-zinc-400 font-medium">Locating...</p>
                        </div>
                    </div>
                ) : (
                    <MapLoader posts={posts} center={center} radius={50} />
                )}

                <div className="absolute top-4 left-4 z-[400] bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg pointer-events-none md:block hidden">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">Explore</h1>
                    <p className="text-zinc-400 text-sm">Discover alerts around you</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
