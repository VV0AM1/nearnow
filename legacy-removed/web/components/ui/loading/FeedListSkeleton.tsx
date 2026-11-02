import FeedItemSkeleton from "./FeedItemSkeleton";

export default function FeedListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <FeedItemSkeleton key={i} />
            ))}
        </div>
    );
}
