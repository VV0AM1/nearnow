import { useState, useEffect } from "react";
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

export function useFeed(location: { lat: number; long: number }, radius: number = 10, category: string = 'ALL') {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
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
                const res = await fetch(`http://localhost:3002/posts/feed?${query}`);
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

    return { posts, loading, error };
}
