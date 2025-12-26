"use client";

import { PostProps } from "./Post.types";
import { usePostInteractions } from "./usePostInteractions";
import PostHeader from "./components/PostHeader";
import PostContent from "./components/PostContent";
import PostActions from "./components/PostActions";

export default function Post({ post, onClick, onHover }: PostProps & { onHover?: (id: string | null) => void }) {
    const { likes, voted, handleVote } = usePostInteractions(post);

    const handleLongPress = () => {
        if (onHover) onHover(post.id);
    };

    return (
        <div
            onClick={() => onClick && onClick(post)}
            onMouseEnter={() => onHover && onHover(post.id)}
            onMouseLeave={() => onHover && onHover(null)}
            // Basic mobile implementation: Touch and hold could be complex, 
            // but user asked for "hold finder on the item card for a bit".
            // For now, let's trigger on touch start (simpler) or we can implement a proper useLongPress hook.
            // Let's stick to mouse events first for desktop, and for mobile maybe a separate button or just simple touch logic?
            // Actually, let's add a "Find on Map" button for mobile explicit action if touch-and-hold is tricky without a hook?
            // Or simpler: TouchStart sets it, TouchEnd clears it or leaves it?
            // User said: "hold finder on the item card for a bit".
            // Let's implement a timer for touchstart.
            onTouchStart={() => {
                const timer = setTimeout(() => {
                    if (onHover) onHover(post.id);
                }, 500); // 500ms hold
                (window as any)._postTouchTimer = timer;
            }}
            onTouchEnd={() => {
                if ((window as any)._postTouchTimer) clearTimeout((window as any)._postTouchTimer);
                // Optionally clear hover on end? "pops up in the map... so user can quickly understand"
                // If they release, maybe it should stay for a bit or clear? 
                // Let's clear it to act like "peek".
                if (onHover) onHover(null);
            }}
            className="group relative overflow-hidden p-3 rounded-xl border border-white/5 
                        bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-md
                        hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-0.5
                        flex gap-3 cursor-pointer transition-all duration-300 ease-out select-none"
        >
            <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm shrink-0
                    bg-gradient-to-br from-slate-800 to-slate-900 text-white/90 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-300`}
            >
                📝
            </div>
            <div className="flex-1 min-w-0">
                <PostHeader title={post.title} category={post.category} />

                <PostContent
                    content={post.content}
                    imageUrl={post.imageUrl}
                    createdAt={post.createdAt}
                    neighborhoodName={post.neighborhood?.name}
                />

                <PostActions
                    id={post.id}
                    title={post.title}
                    content={post.content}
                    commentsCount={post.comments?.length || 0}
                    likes={likes}
                    voted={voted}
                    onVote={handleVote}
                />
            </div>
        </div>
    );
}
