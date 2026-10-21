"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

interface CreateCommentFormProps {
    onSubmit: (content: string) => Promise<void>;
    isSubmitting: boolean;
}

export default function CreateCommentForm({ onSubmit, isSubmitting }: CreateCommentFormProps) {
    const [newComment, setNewComment] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        await onSubmit(newComment);
        setNewComment("");
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 items-center border-t border-border pt-3">
            <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-secondary/10 border border-input rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
            <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-primary/20"
            >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
        </form>
    );
}
