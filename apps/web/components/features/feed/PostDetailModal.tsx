"use client";

import { X } from "lucide-react";
import CommentSection from "./CommentSection";

interface PostDetailModalProps {
    post: any;
    onClose: () => void;
}

export default function PostDetailModal({ post, onClose }: PostDetailModalProps) {
    if (!post) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-card max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-border flex justify-between items-start bg-secondary/5">
                    <div>
                        <span className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded mb-2 inline-block md:mb-0 md:mr-2">
                            {post.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {post.neighborhood?.name} • {new Date(post.createdAt).toLocaleString()}
                        </span>
                        <h2 className="text-2xl font-bold mt-2">{post.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-accent/10 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {post.imageUrl && (
                        <div className="mb-6 rounded-xl overflow-hidden border border-border shadow-sm">
                            <img src={post.imageUrl} alt={post.title} className="w-full h-auto max-h-[300px] object-cover" />
                        </div>
                    )}
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>

                    <div className="mt-8">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            Comments
                        </h3>
                        <CommentSection postId={post.id} />
                    </div>
                </div>
            </div>
        </div>
    );
}
