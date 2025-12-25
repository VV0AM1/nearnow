
import { useState, useEffect } from "react";
import { API_URL } from "../lib/config";

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

    useEffect(() => {
        const fetchMapPosts = async () => {
            // Wait for valid location
            if (!location.lat || !location.long) return;

            try {
                setLoading(true);
                // Hardcoded high limit for map view to see "all" alerts
                const limit = 1000;

                const query = new URLSearchParams({
                    latitude: location.lat.toString(),
                    longitude: location.long.toString(),
                    radius: radius.toString(),
                    category: 'ALL', // Fetch all categories, filter client-side for map smoothness
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

        fetchMapPosts();
    }, [location.lat, location.long, radius]);

    return { posts, loading, error };
}
