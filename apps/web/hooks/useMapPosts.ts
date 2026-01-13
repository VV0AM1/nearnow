import { useState, useEffect } from "react";
import { API_URL } from "../lib/config";
import { useSocket } from "../lib/socket-provider";

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



export function useMapPosts(location: { lat: number; long: number }, radius: number = 50) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const socket = useSocket();

    const fetchMapPosts = async () => {
        // Wait for valid location
        if (!location.lat || !location.long) return;

        try {
            // Hardcoded high limit for map view to see "all" alerts
            const limit = 1000;

            const query = new URLSearchParams({
                latitude: location.lat.toString(),
                longitude: location.long.toString(),
                radius: radius.toString(),
                category: 'ALL',
                page: '1',
                limit: limit.toString()
            });

            const res = await fetch(`${API_URL}/posts/feed?${query}`);
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
    }, [location.lat, location.long, radius]);

    // Socket Listener for Real-time Updates
    useEffect(() => {
        if (!socket) return;
        socket.on('new_post', (newPost: Post) => {
            // Check if new post is within map view (roughly, or just append it safely)
            // For now, simpler to just append it to the map list, maybe checking radius distance if we want to be strict
            // But Map component filters/clusters anyway? No, map displays what it gets.
            // Let's just refetch to be accurate with backend radius calc? 
            // Better: Optimistic append if we trust the event data (it lacks distance info usually).
            // Safest: Just refetch.
            fetchMapPosts();
        });

        return () => {
            socket.off('new_post');
        };
    }, [socket, location, radius]);

    return { posts, loading, error };
}
