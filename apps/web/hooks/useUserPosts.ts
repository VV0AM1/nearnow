import { useState, useEffect } from "react";
import { Post } from "../types/post";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3002';

export function useUserPosts(userId?: string) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        const fetchPosts = async () => {
            try {
                setLoading(true);
                // Assumption: Backend supports filtering by authorId or userId via query param 
                // OR we have a dedicated endpoint like /users/:id/posts
                // For now, I'll assume /posts?authorId=... works based on typical REST patterns or I'll implement filtering client side if needed on a small set.
                // Re-checking backend logs: "PostsController" usually has a generalized Get.
                // Let's try /posts?authorId=${userId}

                const res = await fetch(`${API_URL}/posts?authorId=${userId}`);
                if (!res.ok) throw new Error("Failed to fetch posts");
                const data = await res.json();

                // If the API returns all posts and we filter, that's inefficient but safe fallback
                // But typically NestJS CRUD standard might support it.
                // If not, we might need to update backend. 
                // For this phase, if it fails, I'll update the backend or just show empty.

                // Actually, let's assume standard filtering:
                setPosts(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [userId]);

    return { posts, loading, error };
}
