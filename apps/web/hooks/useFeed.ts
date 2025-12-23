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

export function useFeed(location: { lat: number; long: number }, radius: number = 10, categories: string[] = ['ALL'], initialPosts: Post[] = [], limit: number = 20) {
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
    }, [location.lat, location.long, radius, categoryString, limit]);

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                setLoading(true);
                const query = new URLSearchParams({
                    latitude: location.lat.toString(),
                    longitude: location.long.toString(),
                    radius: radius.toString(),
                    category: categoryString,
                    page: page.toString(),
                    limit: limit.toString()
                });
                const res = await fetch(`${API_URL}/posts/feed?${query}`);
                if (!res.ok) throw new Error("Failed to fetch feed");
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
    }, [location.lat, location.long, radius, categoryString, page, limit]);

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

        socket.on("postCreated", (newPost: Post) => {
            console.log("New post received via socket:", newPost);
            // In pagination, do we prepend? Yes, but only if on page 1?
            // For now, prepend effectively
            if (page === 1) {
                setPosts((prev) => [newPost, ...prev].slice(0, limit)); // Maintain limit
            }
            // If not page 1, maybe show a "New posts available" badge? For simplicity, ignore or notify.
        });

        return () => {
            socket.off("postCreated");
        };
    }, [socket, page, limit]);

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
