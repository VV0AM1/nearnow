"use client";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useMapPosts } from "../../hooks/useMapPosts";
import MapLoader from "../../components/features/map/MapLoader";
import AreaPrompt from "../../components/features/home/AreaPrompt";
import { useDashboard } from "../../context/DashboardContext";

export default function MapPage() {
    const { location } = useDashboard();
    const { posts, error } = useMapPosts(location, 25);

    return (
        <DashboardLayout>
            {!location ? (
                <AreaPrompt />
            ) : (
                <div className="h-full w-full pt-28 px-4 pb-4">
                    <div className="h-full w-full rounded-xl overflow-hidden border border-border shadow-lg relative bg-[#0a0a0a]">
                        <MapLoader posts={posts} center={location} radius={25} />
                        {error && (
                            <div role="alert" className="absolute top-4 right-4 z-[400] bg-background/90 p-3 rounded-lg border border-border text-sm">
                                Could not load posts for this area. Check your connection and refresh.
                            </div>
                        )}
                        <div className="absolute top-4 left-4 z-[400] bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg pointer-events-none md:block hidden">
                            <h1 className="text-2xl font-bold text-white">Explore</h1>
                            <p className="text-zinc-300 text-sm">Community posts around {location.label ?? "your chosen area"} (up to 100 most recent)</p>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
