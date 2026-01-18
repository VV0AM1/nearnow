"use client";

import { useState, useEffect } from "react";
import MapLoader from "../map/MapLoader";
import PostDetailModal from "./PostDetailModal";
import { useFeed } from "../../../hooks/useFeed";
import { useMapPosts } from "../../../hooks/useMapPosts";
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

    // Responsive Limit Logic
    const [limit, setLimit] = useState(4);
    useEffect(() => {
        const updateLimit = () => setLimit(window.innerWidth < 768 ? 2 : 4);
        updateLimit();
        window.addEventListener('resize', updateLimit);
        return () => window.removeEventListener('resize', updateLimit);
    }, []);

    const { posts, loading, error, incrementCommentCount, nextPage, prevPage, hasMore, page } = useFeed(location, radius, categories, initialPosts, limit);
    const [selectedPost, setSelectedPost] = useState<any>(null);

    const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);

    // Initial load check
    const isLoading = loading && posts.length === 0;

    const { posts: mapPosts, loading: mapLoading } = useMapPosts(location, radius);

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
                <div className="flex flex-col-reverse lg:flex-row gap-6 h-auto lg:h-[calc(100vh-240px)]">
                    {/* Feed List Section - Scrollable */}
                    <div className="lg:w-[500px] shrink-0 h-[500px] lg:h-full flex flex-col">
                        <FeedList
                            posts={posts}
                            onPostClick={setSelectedPost}
                            onPostHover={setHighlightedPostId}
                            onNext={nextPage}
                            onPrev={prevPage}
                            hasMore={hasMore}
                            hasPrev={page > 1}
                            loading={loading}
                            page={page}
                        />
                    </div>

                    {/* Map Visualization Section - Flexible */}
                    <div className="w-full h-[400px] lg:h-full lg:flex-1 rounded-xl overflow-hidden shadow-sm border border-border relative order-first lg:order-last">
                        <div className="absolute top-4 right-4 z-10 flex gap-2 pointer-events-none">
                            <div className="bg-black/80 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-white/10">
                                {radius}km Radius
                            </div>
                            <div className="bg-black/80 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-white/10">
                                {mapPosts.length} Active Alerts
                            </div>
                        </div>
                        {/* MapLoader is likely just a wrapper, we need to pass props down through it or check its definition */}
                        <MapLoader posts={mapPosts} center={location} radius={radius} highlightedPostId={highlightedPostId} />
                    </div>
                </div>
            )}
        </>
    );
}
