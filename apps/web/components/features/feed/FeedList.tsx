import { Virtuoso } from "react-virtuoso";
import Post from "./Post";

interface FeedListProps {
    posts: any[];
    onPostClick: (post: any) => void;
    loadMore?: () => void;
    hasMore?: boolean;
    loading?: boolean;
}

export default function FeedList({ posts, onPostClick, loadMore, hasMore, loading }: FeedListProps) {
    if (posts.length === 0) {
        return (
            <div className="text-center text-muted-foreground p-8 border border-dashed border-border rounded-xl flex flex-col items-center justify-center h-40">
                <p>No alerts found nearby.</p>
                <p className="text-xs mt-2 opacity-50">Try increasing the radius or changing filters.</p>
            </div>
        );
    }

    return (
        <Virtuoso
            style={{ height: '100%' }} // Takes parent height
            data={posts}
            endReached={() => hasMore && !loading && loadMore?.()}
            overscan={200}
            itemContent={(index, post) => (
                <div className="pb-4 pr-2">
                    <Post
                        post={post}
                        onClick={onPostClick}
                    />
                </div>
            )}
            components={{
                Footer: () => loading ? (
                    <div className="py-4 flex justify-center w-full">
                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : null
            }}
        />
    );
}
