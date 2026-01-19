import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import MapLoader from "../map/MapLoader";
import PostDetailModal from "./PostDetailModal";
import { useFeed } from "../../../hooks/useFeed";
import { useMapPosts } from "../../../hooks/useMapPosts";
import LocationSearch from "./LocationSearch";
import MapStatsOverlay from "../map/MapStatsOverlay";
import RadiusSlider from "./RadiusSlider";
import CategoryFilter from "./CategoryFilter";
import FeedList from "./FeedList";
import FeedListSkeleton from "../../ui/loading/FeedListSkeleton";
import { useDashboard } from "../../../context/DashboardContext";

import { Post } from "../../../types/post";

interface FeedContainerProps {
    initialLocation?: { lat: number; long: number };
    initialPosts?: Post[];
    onReportClick?: () => void;
}

export default function FeedContainer({ initialLocation, initialPosts = [], onReportClick }: FeedContainerProps) {
    const { location, setLocation, searchQuery } = useDashboard();

    // Sync if initialLocation changes (server side props) - update Global Context
    useEffect(() => {
        if (initialLocation) {
            setLocation(initialLocation);
        }
    }, [initialLocation, setLocation]);

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

    const { posts, loading, error, incrementCommentCount, nextPage, prevPage, hasMore, page } = useFeed(location, radius, categories, initialPosts, limit, searchQuery);
    const [selectedPost, setSelectedPost] = useState<any>(null);

    const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);

    // Initial load check
    const isLoading = loading && posts.length === 0;

    const { posts: mapPosts, loading: mapLoading } = useMapPosts(location, radius);

    return (
        <div className="flex flex-col h-full w-full pt-20">
            {selectedPost && (
                <PostDetailModal
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                    onCommentAdded={(id) => incrementCommentCount(id)}
                />
            )}

            {/* Header Section */}
            <div className="flex-none px-6 pt-6 pb-2 mb-2 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent flex items-center gap-3">
                        <Activity className="h-6 w-6 text-blue-500" />
                        Live Activity Feed
                    </h1>
                    <p className="text-zinc-400 text-xs mt-1 ml-1">Real-time community updates • <span className="text-emerald-400 font-mono animate-pulse">LIVE</span></p>
                </div>


            </div>

            {/* Toolbar: Location Search, Categories & Radius */}
            <div className="flex flex-col gap-4 mb-4 shrink-0 px-4 md:px-0">
                <div className="flex flex-col md:flex-row gap-4 px-2 items-center">
                    <div className="flex-1 w-full md:max-w-2xl ml-1">
                        <LocationSearch
                            onLocationSelect={(lat, long) => setLocation({ lat, long })}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        <div className="w-48 hidden md:block">
                            <RadiusSlider value={radius} onChange={setRadius} />
                        </div>


                    </div>

                    <div className="flex items-center justify-between pl-2">
                        <div className="flex-1 overflow-x-auto no-scrollbar p-2 pl-1">
                            <CategoryFilter selected={categories} onSelect={setCategories} />
                        </div>
                        {/* Mobile Only Radius if needed, otherwise hidden */}
                    </div>
                </div>
            </div>

            {error && <div className="text-center p-4 text-red-500 bg-red-50 rounded-lg mb-4">Error: {error}</div>}

            {isLoading ? (
                <div className="h-full flex flex-col gap-6">
                    <FeedListSkeleton />
                </div>
            ) : (
                <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0 px-4 md:px-6 pb-6">
                    {/* Feed List Section - Scrollable Internally */}
                    <div className="w-full shrink-0 xl:w-[400px] flex flex-col h-full overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-1">
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
                    </div>



                    {/* Map Visualization Section - Fixed */}
                    <div className="w-full h-[45vh] xl:h-full xl:flex-1 rounded-xl overflow-hidden shadow-sm border border-border relative order-first xl:order-last shrink-0">
                        <div className="absolute top-4 left-4 z-10 hidden sm:block pointer-events-none">
                            <MapStatsOverlay posts={mapPosts} radius={radius} onReportClick={onReportClick} />
                        </div>
                        <MapLoader posts={mapPosts} center={location} radius={radius} highlightedPostId={highlightedPostId} />
                    </div>
                </div>
            )}
        </div>
    );
}
