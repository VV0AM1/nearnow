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
            className="group relative overflow-hidden p-4 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-sm
                        hover:bg-white/5 hover:border-white/10 hover:shadow-2xl hover:-translate-y-0.5
                        flex gap-4 cursor-pointer transition-all duration-300"
        >
            <div
                className={`h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0
                    bg-white/5 text-white/80 border border-white/5 shadow-inner`}
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
