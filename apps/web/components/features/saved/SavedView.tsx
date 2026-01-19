"use client";

import { Bookmark, Loader2 } from "lucide-react";
import { useState, useEffect } from 'react';
import { API_URL } from "@/lib/config";
import { getToken, getUserId } from "@/lib/auth";
import FeedList from "@/components/features/feed/FeedList";
import { useRouter } from "next/navigation";

export default function SavedView() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchSaved = async () => {
            const userId = getUserId();
            const token = getToken();

            if (!userId || !token) {
                return;
            }

            try {
                const res = await fetch(`${API_URL}/users/${userId}/saved`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    const mapped = data.map((item: any) => item.post);
                    setPosts(mapped);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSaved();
    }, []);

    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
    const paginatedPosts = posts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-6 pt-24">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Bookmark className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Saved Alerts</h1>
                        <p className="text-muted-foreground">Your collection of important updates</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 border border-dashed border-white/10 rounded-2xl bg-secondary/5 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                        <div className="h-20 w-20 rounded-full bg-secondary/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                            <Bookmark className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-white">No saved alerts yet</h2>
                        <p className="text-muted-foreground max-w-sm">
                            Bookmark alerts from the feed or map to quickly access them here. They will be stored securely for you.
                        </p>
                    </div>
                ) : (
                    <div className="h-[600px] flex flex-col animate-in slide-in-from-bottom-4 duration-700">
                        <FeedList
                            posts={paginatedPosts}
                            onPostClick={(post) => router.push(`/post/${post.id}`)}
                            onNext={() => handlePageChange(page + 1)}
                            onPrev={() => handlePageChange(page - 1)}
                            hasMore={page < totalPages}
                            hasPrev={page > 1}
                            loading={loading}
                            page={page}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
