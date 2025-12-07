"use client";

import { useState, useEffect } from "react";
import MapLoader from "../map/MapLoader";
import PostDetailModal from "./PostDetailModal";
import { useFeed } from "../../../hooks/useFeed";
import LocationSearch from "./LocationSearch";
import RadiusSlider from "./RadiusSlider";
import CategoryFilter, { getCategoryColor } from "./CategoryFilter";

interface FeedContainerProps {
    initialLocation?: { lat: number; long: number };
}

export default function FeedContainer({ initialLocation }: FeedContainerProps) {
    const [location, setLocation] = useState(initialLocation || { lat: 37.7749, long: -122.4194 });

    // Sync if initialLocation changes (e.g. from parent)
    useEffect(() => {
        if (initialLocation) {
            setLocation(initialLocation);
        }
    }, [initialLocation]);

    const [radius, setRadius] = useState(10);
    const [category, setCategory] = useState("ALL");
    const { posts, loading, error } = useFeed(location, radius, category);
    const [selectedPost, setSelectedPost] = useState<any>(null);

    // Initial load check
    const isLoading = loading && posts.length === 0;

    return (
        <>
            <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />

            <div className="space-y-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <LocationSearch
                            onLocationSelect={(lat, long) => setLocation({ lat, long })}
                        />
                    </div>
                    <div className="md:w-64">
                        <RadiusSlider value={radius} onChange={setRadius} />
                    </div>
                </div>

                <CategoryFilter selected={category} onSelect={setCategory} />
            </div>

            {error && <div className="text-center p-4 text-red-500 bg-red-50 rounded-lg mb-4">Error: {error}</div>}

            {isLoading ? (
                <div className="text-center p-12 text-muted-foreground">Searching nearby...</div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
                    {/* Feed List */}
                    <div className="lg:w-1/3 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        {posts.length === 0 ? (
                            <div className="text-center text-muted-foreground p-8 border border-dashed border-border rounded-xl">
                                <p>No alerts found nearby.</p>
                                <p className="text-xs mt-2 opacity-50">Try increasing the radius or changing filters.</p>
                            </div>
                        ) : (
                            posts.map((post: any) => {
                                const colorClass = getCategoryColor(post.category);
                                return (
                                    <div
                                        key={post.id}
                                        onClick={() => setSelectedPost(post)}
                                        className="bg-card p-4 rounded-xl border border-border shadow-sm flex gap-4 hover:bg-accent/5 transition-colors cursor-pointer"
                                    >
                                        <div className={`h-10 w-10 rounded-full ${colorClass.replace('bg-', 'bg-opacity-20 text-')} flex items-center justify-center text-xl shrink-0`}>
                                            📝
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold text-sm">{post.title}</h3>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${colorClass}`}>
                                                    {post.category}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{post.content}</p>
                                            <div className="mt-2 text-[10px] text-muted-foreground flex gap-2">
                                                <span>{new Date(post.createdAt).toLocaleTimeString()}</span>
                                                <span>•</span>
                                                <span>{post.neighborhood?.name || "Unknown Area"}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Map Visualization */}
                    <div className="lg:w-2/3 h-full rounded-xl overflow-hidden shadow-sm border border-border relative">
                        <div className="absolute top-4 right-4 z-[400] flex gap-2">
                            <div className="bg-background/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-md border border-border">
                                {radius}km Radius
                            </div>
                            <div className="bg-background/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-md border border-border">
                                {posts.length} Active Alerts
                            </div>
                        </div>
                        <MapLoader posts={posts} center={location} radius={radius} />
                    </div>
                </div>
            )}
        </>
    );
}
