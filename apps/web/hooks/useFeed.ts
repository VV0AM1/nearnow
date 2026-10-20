import { useState, useEffect } from "react";
import { API_URL } from "../lib/config";
import { useSocket } from "../lib/socket-provider";
import { getToken } from "../lib/auth";

const toRad = (d: number) => (d * Math.PI) / 180;
function distanceKm(a: { lat: number; long: number }, b: { lat: number; long: number }) {
    const h = Math.sin(toRad(b.lat - a.lat) / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.long - a.long) / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

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

export function useFeed(location: { lat: number; long: number } | null, radius: number = 10, categories: string[] = ['ALL'], initialPosts: Post[] = [], limit: number = 20, searchQuery: string = '') {
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [loading, setLoading] = useState(initialPosts.length === 0);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const socket = useSocket();

    // serialize categories to avoid infinite loop on reference change
    const categoryString = categories.join(',');

    useEffect(() => {
        setPage(1);
        setHasMore(true);
        // setPosts([]); // Don't clear immediately to avoid flicker, just loading state?
        // Actually clearing is safer for state consistency but flicker is bad.
        // Let's keep existing posts until new ones load if we want smoothness, but for clarity let's clear or handle in loading.
    }, [location?.lat, location?.long, radius, categoryString, limit, searchQuery]);

    useEffect(() => {
        const fetchFeed = async () => {
            if (!location) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const query = new URLSearchParams({
                    latitude: location.lat.toString(),
                    longitude: location.long.toString(),
                    radius: radius.toString(),
                    category: categoryString,
                    search: searchQuery,
                    page: page.toString(),
                    limit: limit.toString()
                });
                const token = getToken();
                const res = await fetch(`${API_URL}/posts/feed?${query}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                if (!res.ok) throw new Error("Could not load posts for this area. Check your connection and try again.");
                setError(null);
                const data = await res.json();

                if (data.length < limit) setHasMore(false);
                else setHasMore(true);

                // Manual Pagination: Replace posts, don't append
                setPosts(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFeed();
    }, [location?.lat, location?.long, radius, categoryString, page, limit, searchQuery]);

    const nextPage = () => {
        if (!loading && hasMore) {
            setPage(prev => prev + 1);
        }
    };

    const prevPage = () => {
        if (!loading && page > 1) {
            setPage(prev => prev - 1);
        }
    };

    // Live updates via Socket
    useEffect(() => {
        if (!socket) return;

        const onPostCreated = (newPost: Post) => {
            // Only show live posts that belong in the current view (area, radius, category).
            if (!location || page !== 1 || searchQuery) return;
            if (distanceKm(location, { lat: newPost.latitude, long: newPost.longitude }) > radius) return;
            if (categoryString !== "ALL" && !categoryString.split(",").includes(newPost.category)) return;
            setPosts((prev) => (prev.some((p) => p.id === newPost.id) ? prev : [newPost, ...prev].slice(0, limit)));
        };
        socket.on("postCreated", onPostCreated);
        return () => {
            socket.off("postCreated", onPostCreated);
        };
    }, [socket, page, limit, location, radius, categoryString, searchQuery]);

    const incrementCommentCount = (postId: string) => {
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                const currentComments = p.comments || [];
                return {
                    ...p,
                    comments: [...currentComments, { id: 'temp' }]
                };
            }
            return p;
        }));
    };

    return { posts, loading, error, incrementCommentCount, nextPage, prevPage, hasMore, page };
}
