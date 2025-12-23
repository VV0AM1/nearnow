"use client";

import { useState, useEffect } from "react";
import MapLoader from "../map/MapLoader";
import PostDetailModal from "./PostDetailModal";
import { useFeed } from "../../../hooks/useFeed";
import LocationSearch from "./LocationSearch";
import RadiusSlider from "./RadiusSlider";
import CategoryFilter from "./CategoryFilter";
import FeedList from "./FeedList";
import FeedListSkeleton from "../../ui/loading/FeedListSkeleton";

import { Post } from "../../../types/post";

interface FeedContainerProps {
    initialLocation?: { lat: number; long: number };
    initialPosts?: Post[];
}

export default function FeedContainer({ initialLocation, initialPosts = [] }: FeedContainerProps) {
    const [location, setLocation] = useState(initialLocation || { lat: 37.7749, long: -122.4194 });

    // Sync if initialLocation changes (e.g. from parent)
    useEffect(() => {
        if (initialLocation) {
            setLocation(initialLocation);
        }
    }, [initialLocation]);

    const [radius, setRadius] = useState(10);
    const [categories, setCategories] = useState<string[]>(["ALL"]);
    const { posts, loading, error, incrementCommentCount, loadMore, hasMore } = useFeed(location, radius, categories, initialPosts);
    const [selectedPost, setSelectedPost] = useState<any>(null);

    // Initial load check
    const isLoading = loading && posts.length === 0;

    return (
        <>
            {selectedPost && (
                <PostDetailModal
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                    onCommentAdded={(id) => incrementCommentCount(id)}
                />
            )}

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

                <CategoryFilter selected={categories} onSelect={setCategories} />
            </div>

            {error && <div className="text-center p-4 text-red-500 bg-red-50 rounded-lg mb-4">Error: {error}</div>}

            {isLoading ? (
                <div className="h-[600px] flex flex-col gap-6">
                    <FeedListSkeleton />
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
                    {/* Feed List Section */}
                    <div className="lg:w-1/3 h-full">
                        <FeedList
                            posts={posts}
                            onPostClick={setSelectedPost}
                            loadMore={loadMore}
                            hasMore={hasMore}
                            loading={loading}
                        />
                    </div>

                    {/* Map Visualization Section */}
                    <div className="lg:w-2/3 h-full rounded-xl overflow-hidden shadow-sm border border-border relative">
                        <div className="absolute top-4 right-4 z-[400] flex gap-2 pointer-events-none">
                            <div className="bg-black/80 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-white/10">
                                {radius}km Radius
                            </div>
                            <div className="bg-black/80 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-white/10">
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
