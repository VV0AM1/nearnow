"use client";

import { PostProps } from "./Post.types";
import { usePostInteractions } from "./usePostInteractions";
import PostHeader from "./components/PostHeader";
import PostContent from "./components/PostContent";
import PostActions from "./components/PostActions";

export default function Post({ post, onClick }: PostProps) {
    const { likes, voted, handleVote } = usePostInteractions(post);

    return (
        <div
            onClick={() => onClick && onClick(post)}
            className="group relative overflow-hidden p-3 md:p-4 rounded-xl border border-border/70
                        bg-gradient-to-br from-background/80 via-background/95 to-card/95
                        shadow-[0_18px_45px_rgba(15,23,42,0.55)]
                        flex gap-3 md:gap-4 cursor-pointer
                        hover:border-primary/60 hover:shadow-[0_22px_55px_rgba(15,23,42,0.85)]
                        transition-all"
        >
            <div
                className={`h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center text-lg md:text-xl shrink-0
                    bg-gradient-to-tr from-primary/25 via-accent/15 to-secondary/25
                    text-primary-foreground shadow-inner`}
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
