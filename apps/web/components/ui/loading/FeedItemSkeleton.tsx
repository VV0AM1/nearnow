import Skeleton from "./Skeleton";

export default function FeedItemSkeleton() {
    return (
        <div className="p-4 rounded-xl border border-border bg-card/30 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
            </div>
            <Skeleton className="h-24 w-full rounded-lg" />
            <div className="flex gap-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
            </div>
        </div>
    );
}
