import { useState, useEffect } from "react";
import { API_URL } from "@/lib/config";
import { getUserId } from "@/lib/auth";
import { Post } from "./Post.types";

export function usePostInteractions(post: Post) {
    const [likes, setLikes] = useState(post.likes || 0);
    const [voted, setVoted] = useState(false);
    const [saved, setSaved] = useState(false); // New Saved State

    useEffect(() => {
        const checkInteractions = async () => {
            // Use lib/auth helper which uses LocalStorage
            const userId = getUserId();
            if (!userId) return;

            try {
                // 1. Check Local Storage first
                const localVote = localStorage.getItem(`voted_${post.id}`);
                if (localVote === 'true') setVoted(true);

                // 2. Sync (but prefer local if true)
                const voteRes = await fetch(`${API_URL}/posts/${post.id}/vote/check?userId=${userId}`);
                if (voteRes.ok) {
                    const data = await voteRes.json();
                    if (localVote === 'true') setVoted(true);
                    else setVoted(data.hasVoted);
                }

                // Check Saved (Mocked for now as backend might not have it, but let's assume endpoint exists or localStorage)
                // MVP: Save to localStorage to persist "Saved" visually if backend missing?
                // Real: GET /users/me/saved or /posts/:id/saved
                // For now, let's use localStorage for "Saved" state to be instant and safe for MVP if API missing.
                const localSaved = localStorage.getItem(`saved_post_${post.id}`);
                if (localSaved) setSaved(true);

            } catch (e) {
                console.error(e);
            }
        };
        checkInteractions();
    }, [post.id]);

    const handleVote = async (e: React.MouseEvent) => {
        e.stopPropagation();

        const userId = getUserId();
        if (!userId) return;

        // Optimistic UI
        const newVoted = !voted;
        setVoted(newVoted);
        setLikes((prev) => newVoted ? prev + 1 : prev - 1);

        // Update Local Cache immediately
        if (newVoted) {
            localStorage.setItem(`voted_${post.id}`, 'true');
        } else {
            localStorage.removeItem(`voted_${post.id}`);
        }

        try {
            await fetch(`${API_URL}/posts/${post.id}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, type: 'UP' }) // Toggle logic is usually handled by backend or separate Delete
            });
        } catch (err) {
            // Revert on error
            setVoted(!newVoted);
            setLikes((prev) => !newVoted ? prev + 1 : prev - 1);
            // Revert Cache
            if (!newVoted) localStorage.setItem(`voted_${post.id}`, 'true');
            else localStorage.removeItem(`voted_${post.id}`);
        }
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSaved(prev => !prev);

        if (!saved) {
            localStorage.setItem(`saved_post_${post.id}`, 'true');
            // user feedback via toast usually handled by component
        } else {
            localStorage.removeItem(`saved_post_${post.id}`);
        }
    };

    return { likes, voted, saved, handleVote, handleSave };
}
