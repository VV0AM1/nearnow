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
    return (
        <div className="flex flex-col h-full bg-black/40 rounded-xl border border-white/10 overflow-hidden backdrop-blur-md shadow-2xl">
            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {posts.length === 0 && !loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground animate-in fade-in duration-300">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl">📭</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">No alerts listed</h3>
                        <p className="text-xs max-w-[200px]">
                            {page > 1 ? "You've reached the end of the list." : "Try increasing the radius or changing filters."}
                        </p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <Post
                            key={post.id}
                            post={post}
                            onClick={onPostClick}
                        />
                    ))
                )}

                {loading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-primary h-8 w-8" />
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-white/10 bg-black/60 backdrop-blur-xl flex items-center justify-between z-10">
                <button
                    onClick={onPrev}
                    disabled={!hasPrev || loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium text-white shadow-lg border border-white/5"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                </button>

                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Page</span>
                    <span className="text-lg font-black text-white leading-none">{page}</span>
                </div>

                <button
                    onClick={onNext}
                    disabled={!hasMore || loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium text-white shadow-lg border border-white/5"
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
