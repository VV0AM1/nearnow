import { useState, useEffect } from "react";
import { API_URL } from "../lib/config";
import { useSocket } from "../lib/socket-provider";
import { getToken } from "../lib/auth";

export interface Post {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    latitude: number;
    longitude: number;
    category: string;
    neighborhood?: {
        name: string;
    };
    [key: string]: any;
}



export function useMapPosts(location: { lat: number; long: number } | null, radius: number = 50) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const socket = useSocket();

    const fetchMapPosts = async () => {
        // Wait for valid location
        if (!location) return;

        try {
            // The API caps a page at 100 posts.
            const limit = 100;

            const query = new URLSearchParams({
                latitude: location.lat.toString(),
                longitude: location.long.toString(),
                radius: radius.toString(),
                category: 'ALL',
                page: '1',
                limit: limit.toString()
            });

            const token = getToken();
            const res = await fetch(`${API_URL}/posts/feed?${query}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            if (!res.ok) throw new Error("Failed to fetch map data");

            const data = await res.json();
            setPosts(data);
        } catch (err: any) {
            console.error("Map fetch error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchMapPosts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location?.lat, location?.long, radius]);

    // Socket Listener for Real-time Updates
    useEffect(() => {
        if (!socket) return;
        // The server emits 'postCreated' for every new post; refetch the bounded area.
        const onPostCreated = () => void fetchMapPosts();
        socket.on('postCreated', onPostCreated);
        return () => {
            socket.off('postCreated', onPostCreated);
        };
    }, [socket, location, radius]);

    return { posts, loading, error };
}
