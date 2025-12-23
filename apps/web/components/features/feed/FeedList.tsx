import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Post from "./Post";

interface FeedListProps {
    posts: any[];
    onPostClick: (post: any) => void;
    onNext: () => void;
    onPrev: () => void;
    hasMore: boolean;
    hasPrev: boolean;
    loading: boolean;
    page: number;
}

export default function FeedList({ posts, onPostClick, onNext, onPrev, hasMore, hasPrev, loading, page }: FeedListProps) {
    if (posts.length === 0 && !loading) {
        return (
            <div className="text-center text-muted-foreground p-8 border border-dashed border-border rounded-xl flex flex-col items-center justify-center h-40">
                <p>No alerts found nearby.</p>
                <p className="text-xs mt-2 opacity-50">Try increasing the radius or changing filters.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-black/20 rounded-xl border border-white/5 overflow-hidden backdrop-blur-sm">
            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {posts.map((post) => (
                    <Post
                        key={post.id}
                        post={post}
                        onClick={onPostClick}
                    />
                ))}
                {loading && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-primary h-8 w-8" />
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
                <button
                    onClick={onPrev}
                    disabled={!hasPrev || loading}
                    className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-zinc-400 hover:text-white"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                <span className="text-sm font-medium text-zinc-400">
                    Page <span className="text-white">{page}</span>
                </span>

                <button
                    onClick={onNext}
                    disabled={!hasMore || loading}
                    className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-zinc-400 hover:text-white"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
