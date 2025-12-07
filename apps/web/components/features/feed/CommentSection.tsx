"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Send, User as UserIcon } from "lucide-react";
import { getToken } from "../../../lib/auth";

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    author: {
        id: string;
        email: string; // or name if available
    };
}

export default function CommentSection({ postId }: { postId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState("");

    const fetchComments = useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:3002/comments/${postId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (err) {
            console.error("Failed to fetch comments", err);
        } finally {
            setLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const token = getToken();
        if (!token) {
            alert("Please login to comment");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("http://localhost:3002/comments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: newComment,
                    postId
                })
            });

            if (res.ok) {
                setNewComment("");
                fetchComments(); // Refresh list
            } else {
                alert("Failed to post comment");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mt-4 space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Comments ({comments.length})</h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="text-center py-4"><Loader2 className="animate-spin h-5 w-5 mx-auto text-muted-foreground" /></div>
                ) : comments.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-4">No comments yet. Be the first!</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="bg-secondary/20 p-3 rounded-lg text-sm border border-border/50">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="h-5 w-5 rounded-full bg-secondary/40 flex items-center justify-center">
                                    <UserIcon className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <span className="font-bold text-xs opacity-70">
                                    {comment.author.email.split('@')[0]}
                                </span>
                                <span className="text-[10px] text-muted-foreground ml-auto">
                                    {new Date(comment.createdAt).toLocaleTimeString()}
                                </span>
                            </div>
                            <p className="text-foreground/90 pl-7">{comment.content}</p>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2 items-center border-t border-border pt-3">
                <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 bg-secondary/10 border border-input rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
                <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-primary/20"
                >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
            </form>
        </div>
    );
}
