import { useState, useCallback } from "react";
import { API_URL } from "../lib/config";
import { getToken } from "../lib/auth";

export interface Comment {
    id: string;
    content: string;
    createdAt: string;
    author: {
        id: string;
        email: string;
    };
}

export function useComments(postId: string) {
    const [comments, setComments] = useState<Comment[]>([]);
    // Initialize loading to true ONLY if we don't have initial data (or if we plan to fetch immediately)
    // Actually, CommentSection sets initial data via setComments.
    // Better pattern: Let the component drive the fetch if needed.
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/comments/${postId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            } else {
                setError("Failed to load comments");
            }
        } catch (err) {
            console.error("Failed to fetch comments", err);
            setError("Failed to load comments");
        } finally {
            setLoading(false);
        }
    }, [postId]);

    const createComment = async (content: string) => {
        const token = getToken();
        if (!token) {
            alert("Please login to comment");
            return false;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    content,
                    postId
                })
            });

            if (res.ok) {
                await fetchComments(); // Refresh list
                return true;
            } else {
                alert("Failed to post comment");
                return false;
            }
        } catch (err) {
            console.error(err);
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    return { comments, loading, submitting, error, fetchComments, createComment, setComments };
}
