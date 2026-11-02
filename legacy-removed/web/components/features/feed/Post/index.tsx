"use client";

import { useState, useRef, MouseEvent } from "react";
import { PostProps } from "./Post.types";
import { usePostInteractions } from "./usePostInteractions";
import PostHeader from "./components/PostHeader";
import PostContent from "./components/PostContent";
import PostActions from "./components/PostActions";
import styles from "./Post.module.css";

export default function Post({ post, onClick, onHover }: PostProps & { onHover?: (id: string | null) => void }) {
    const { likes, voted, saved, handleVote, handleSave } = usePostInteractions(post);

    return (
        <div className={styles.cardWrapper}>
            <div
                onClick={() => onClick && onClick(post)}
                onMouseEnter={() => onHover && onHover(post.id)}
                onMouseLeave={() => onHover && onHover(null)}
                className={`${styles.card} group relative overflow-hidden p-4 rounded-2xl border border-white/5 
                            bg-gradient-to-b from-slate-900/40 to-slate-950/40 backdrop-blur-xl
                            hover:border-blue-500/30 hover:shadow-[0_10px_40px_rgba(59,130,246,0.15)]
                            flex gap-4 cursor-pointer select-none transition-all duration-300 ease-out`}
            >
                {/* Icon Layer */}
                <div
                    className={`${styles.iconLayer} h-12 w-12 rounded-full flex items-center justify-center text-xl shrink-0
                        bg-gradient-to-br from-slate-800 to-slate-900 text-white/90 border border-white/10 shadow-inner group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all duration-300`}
                >
                    📝
                </div>

                {/* Content Layer */}
                <div className={`${styles.contentLayer} flex-1 min-w-0 space-y-3`}>
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
                        saved={saved}
                        onVote={handleVote}
                        onSave={handleSave}
                    />
                </div>
            </div>
        </div>
    );
}
