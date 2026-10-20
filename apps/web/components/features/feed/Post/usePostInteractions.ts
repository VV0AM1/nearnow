import { useState, useEffect } from "react";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Post } from "./Post.types";

/** Like/save backed by the API (viewer state arrives with the post), with rollback. */
export function usePostInteractions(post: Post) {
    const [likes, setLikes] = useState(post.likes || 0);
    const [voted, setVoted] = useState(!!post.viewer?.hasVoted);
    const [saved, setSaved] = useState(!!post.viewer?.hasSaved);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setLikes(post.likes || 0);
        setVoted(!!post.viewer?.hasVoted);
        setSaved(!!post.viewer?.hasSaved);
    }, [post.id, post.likes, post.viewer?.hasVoted, post.viewer?.hasSaved]);

    const handleVote = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!getToken() || busy) return;
        setBusy(true);
        const prev = { voted, likes };
        setVoted(!voted);
        setLikes(Math.max(0, likes + (voted ? -1 : 1)));
        try {
            const res = await apiFetch<{ liked: boolean; likes: number }>(`/posts/${post.id}/vote`, { method: "POST", json: { type: "UP" } });
            setVoted(res.liked);
            setLikes(res.likes);
        } catch {
            setVoted(prev.voted);
            setLikes(prev.likes);
        } finally {
            setBusy(false);
        }
    };

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!getToken()) return;
        const want = !saved;
        setSaved(want);
        try {
            const res = await apiFetch<{ saved: boolean }>(`/users/me/saved/${post.id}`, { method: "POST", json: { saved: want } });
            setSaved(res.saved);
        } catch {
            setSaved(!want);
        }
    };

    return { likes, voted, saved, handleVote, handleSave };
}
