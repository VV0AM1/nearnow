import Skeleton from "./Skeleton";

export default function FeedItemSkeleton() {
    return (
        <div className="p-4 rounded-xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-md space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3 bg-white/10" />
                    <Skeleton className="h-3 w-1/4 bg-white/5" />
                </div>
            </div>
            <Skeleton className="h-24 w-full rounded-lg bg-white/5" />
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <div className="flex gap-4">
                    <Skeleton className="h-6 w-12 rounded-full bg-white/5" />
                    <Skeleton className="h-6 w-12 rounded-full bg-white/5" />
                </div>
                <Skeleton className="h-6 w-6 rounded-full bg-white/5" />
            </div>
        </div>
    );
}
