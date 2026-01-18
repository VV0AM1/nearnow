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
    const cardRef = useRef<HTMLDivElement>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        // Max rotation degrees
        const maxRot = 8;

        const rotateY = (mouseX / (rect.width / 2)) * maxRot;
        const rotateX = -1 * (mouseY / (rect.height / 2)) * maxRot;

        setRotation({ x: rotateX, y: rotateY });

        if (onHover) onHover(post.id);
    };

    const handleMouseLeave = () => {
        setRotation({ x: 0, y: 0 });
        if (onHover) onHover(null);
    };

    return (
        <div className={styles.cardWrapper}>
            <div
                ref={cardRef}
                onClick={() => onClick && onClick(post)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchStart={() => {
                    const timer = setTimeout(() => {
                        if (onHover) onHover(post.id);
                    }, 500);
                    (window as any)._postTouchTimer = timer;
                }}
                onTouchEnd={() => {
                    if ((window as any)._postTouchTimer) clearTimeout((window as any)._postTouchTimer);
                    if (onHover) onHover(null);
                }}
                style={{
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
                }}
                className={`${styles.card} group relative overflow-hidden p-3 rounded-2xl border border-white/5 
                            bg-gradient-to-b from-slate-900/40 to-slate-950/40 backdrop-blur-xl
                            hover:border-blue-500/50 hover:shadow-[0_0_40px_rgba(59,130,246,0.2)]
                            flex gap-3 cursor-pointer select-none transition-colors duration-300`}
            >
                {/* Icon Layer */}
                <div
                    className={`${styles.iconLayer} h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0
                        bg-gradient-to-br from-slate-800 to-slate-900 text-white/90 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-300`}
                >
                    📝
                </div>

                {/* Content Layer */}
                <div className={`${styles.contentLayer} flex-1 min-w-0`}>
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
