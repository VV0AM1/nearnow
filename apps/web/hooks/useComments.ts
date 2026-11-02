import { useCallback, useState } from "react";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";

/** Mirrors the API: authors are public profiles (id, name, avatar) — never an email. */
export interface Comment {
    id: string;
    content: string;
    createdAt: string;
    author: { id: string; name: string | null; avatar?: string | null } | null;
}

export function useComments(postId: string) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchComments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setComments(await apiFetch<Comment[]>(`/comments/${postId}`));
        } catch {
            setError("Comments could not be loaded.");
        } finally {
            setLoading(false);
        }
    }, [postId]);

    /** Returns null on success, or a message to show. */
    const createComment = async (content: string): Promise<string | null> => {
        if (!getToken()) return "Sign in to comment.";
        setSubmitting(true);
        try {
            const created = await apiFetch<Comment>("/comments", { method: "POST", json: { content, postId } });
            setComments((prev) => [...prev, created]);
            return null;
        } catch (e) {
            return e instanceof Error ? e.message : "Your comment was not posted.";
        } finally {
            setSubmitting(false);
        }
    };

    return { comments, loading, submitting, error, fetchComments, createComment, setComments };
}
