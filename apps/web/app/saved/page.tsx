"use client";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { Bookmark, Loader2 } from "lucide-react";
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { API_URL } from "@/lib/config";
import { getToken, getUserId } from "../../lib/auth"; // Keep this import as it's used
import FeedList from "../../components/features/feed/FeedList";
import { useRouter } from "next/navigation";

export default function SavedPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchSaved = async () => {
            const userId = getUserId();
            const token = getToken();

            if (!userId || !token) {
                // Redirect handled by auth guards usually, but safe fallback
                return;
            }

            try {
                const res = await fetch(`${API_URL}/users/${userId}/saved`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    // Map the savedPost structure back to FeedList Post structure
                    // savedPost is { id, post: { ... } }
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

    return (
        <DashboardLayout>
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
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 border border-dashed border-border rounded-xl bg-secondary/5">
                        <Bookmark className="h-16 w-16 text-muted-foreground/30 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">No saved alerts yet</h2>
                        <p className="text-muted-foreground max-w-sm">
                            Bookmark alerts to quickly access them here. They will be stored securely for you.
                        </p>
                    </div>
                ) : (
                    <FeedList posts={posts} onPostClick={(post) => router.push(`/post/${post.id}`)} />
                )}
            </div>
        </DashboardLayout>
    );
}
