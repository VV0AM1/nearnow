import Post from "./Post";

interface FeedListProps {
    posts: any[];
    onPostClick: (post: any) => void;
}

export default function FeedList({ posts, onPostClick }: FeedListProps) {
    if (posts.length === 0) {
        return (
            <div className="text-center text-muted-foreground p-8 border border-dashed border-border rounded-xl flex flex-col items-center justify-center h-40">
                <p>No alerts found nearby.</p>
                <p className="text-xs mt-2 opacity-50">Try increasing the radius or changing filters.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pr-2">
            {posts.map((post) => (
                <Post
                    key={post.id}
                    post={post}
                    onClick={onPostClick}
                />
            ))}
        </div>
    );
}
