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
            className="group relative overflow-hidden p-4 rounded-2xl border border-white/5 
                        bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-md
                        hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1
                        flex gap-4 cursor-pointer transition-all duration-300 ease-out"
        >
            <div
                className={`h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0
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
