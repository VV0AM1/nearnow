import { useState, useEffect } from "react";
import { API_URL } from "@/lib/config";
import Cookies from "js-cookie";
import { Post } from "./Post.types";

export function usePostInteractions(post: Post) {
    const [likes, setLikes] = useState(post.likes || 0);
    const [voted, setVoted] = useState(false);

    useEffect(() => {
        const checkVote = async () => {
            const userId = Cookies.get("nearnow_user_id");
            if (!userId) return;

            try {
                const res = await fetch(`${API_URL}/posts/${post.id}/vote/check?userId=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setVoted(data.hasVoted);
                }
            } catch (e) {
                console.error(e);
            }
        };
        checkVote();
    }, [post.id]);

    const handleVote = async (e: React.MouseEvent) => {
        e.stopPropagation();

        // Optimistic UI
        setVoted((prev) => !prev);
        setLikes((prev) => voted ? prev - 1 : prev + 1);

        try {
            const userId = Cookies.get("nearnow_user_id");
            if (!userId) return;

            await fetch(`${API_URL}/posts/${post.id}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, type: 'UP' })
            });
        } catch (err) {
            // Revert
            setVoted((prev) => !prev);
            setLikes((prev) => voted ? prev + 1 : prev - 1);
        }
    };

    return { likes, voted, handleVote };
}
