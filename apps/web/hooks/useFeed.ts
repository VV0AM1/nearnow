import { useState, useEffect } from "react";
import { API_URL } from "../lib/config";
import { useSocket } from "../lib/socket-provider";

export interface Post {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    neighborhood?: {
        name: string;
    };
    [key: string]: any;
}

export function useFeed(location: { lat: number; long: number }, radius: number = 10, category: string = 'ALL', initialPosts: Post[] = []) {
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [loading, setLoading] = useState(initialPosts.length === 0);
    const [error, setError] = useState<string | null>(null);
    const socket = useSocket();

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                setLoading(true);
                const query = new URLSearchParams({
                    latitude: location.lat.toString(),
                    longitude: location.long.toString(),
                    radius: radius.toString(),
                    category: category,
                });
                const res = await fetch(`${API_URL}/posts/feed?${query}`);
                if (!res.ok) throw new Error("Failed to fetch feed");
                const data = await res.json();
                setPosts(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFeed();
    }, [location.lat, location.long, radius, category]);

    // Live updates via Socket
    useEffect(() => {
        if (!socket) return;

        socket.on("postCreated", (newPost: Post) => {
            console.log("New post received via socket:", newPost);
            setPosts((prev) => [newPost, ...prev]);
        });

        return () => {
            socket.off("postCreated");
        };
    }, [socket]);

    const incrementCommentCount = (postId: string) => {
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                // If comments array exists, push placeholder or just rely on length logic if needed
                // Assuming we just want to update display if we were showing count separately
                // But PostItem usually uses post.comments.length.
                const currentComments = p.comments || [];
                return {
                    ...p,
                    comments: [...currentComments, { id: 'temp' }] // Fake add to increase length immediately
                };
            }
            return p;
        }));
    };

    return { posts, loading, error, incrementCommentCount };
}
