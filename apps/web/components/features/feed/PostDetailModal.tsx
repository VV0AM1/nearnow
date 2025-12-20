"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Bookmark } from "lucide-react";
import CommentSection from "./CommentSection";
import CategoryBadge from "../../common/display/CategoryBadge";
import ShareButton from "../../common/input/ShareButton";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";
import { getToken, getUserId } from "../../../lib/auth";

interface PostDetailModalProps {
    post: any;
    onClose: () => void;
    onCommentAdded?: (postId: string) => void;
}

export default function PostDetailModal({ post, onClose, onCommentAdded }: PostDetailModalProps) {
    useBodyScrollLock();
    const [mounted, setMounted] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Check saved status
        const checkSaved = async () => {
            const userId = getUserId();
            const token = getToken();
            if (!userId || !token) return;

            try {
                const res = await fetch(`http://127.0.0.1:3002/users/${userId}/saved/${post.id}/check`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSaved(data.isSaved);
                }
            } catch (err) {
                console.error("Failed to check saved status", err);
            }
        };
        checkSaved();

        return () => setMounted(false);
    }, [post.id]);

    const handleToggleSave = async () => {
        const userId = getUserId();
        const token = getToken();
        if (!userId || !token) {
            alert("Please login to save posts");
            return;
        }

        setLoading(true);
        // Optimistic toggle
        setSaved(prev => !prev);

        try {
            const res = await fetch(`http://127.0.0.1:3002/users/${userId}/saved/${post.id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                // Revert on failure
                setSaved(prev => !prev);
                console.error("Failed to toggle save");
            }
        } catch (err) {
            setSaved(prev => !prev);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!post || !mounted) return null;

    // Use Portal to escape stacking contexts (fixing z-index bleed)
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="glass-card max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 z-10">
                <div className="p-6 border-b border-border flex justify-between items-start bg-secondary/5">
                    <div>
                        <CategoryBadge category={post.category} className="mb-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                            {post.neighborhood?.name} • {new Date(post.createdAt).toLocaleString()}
                        </div>
                        <h2 className="text-2xl font-bold mt-2">{post.title}</h2>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleToggleSave}
                            disabled={loading}
                            className={`p-2 rounded-full transition-colors ${saved ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-accent/10'}`}
                        >
                            <Bookmark className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
                        </button>

                        <ShareButton postId={post.id} title={post.title} text={post.content} />
                        <button onClick={onClose} className="p-2 hover:bg-accent/10 rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {post.imageUrl && (
                        <div className="mb-6 rounded-xl overflow-hidden border border-border shadow-sm">
                            <img
                                src={post.imageUrl.startsWith('http') ? post.imageUrl : `http://127.0.0.1:3002${post.imageUrl}`}
                                alt={post.title}
                                className="w-full h-auto max-h-[300px] object-cover"
                            />
                        </div>
                    )}
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>

                    <div className="mt-8">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            Comments
                        </h3>
                        <CommentSection postId={post.id} onCommentAdded={() => onCommentAdded?.(post.id)} />
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
