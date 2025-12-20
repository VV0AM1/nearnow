```javascript
"use client";

import { notFound, useRouter, useSearchParams } from "next/navigation";
import CommentSection from "@/components/features/feed/CommentSection";
import { Post as PostComponent } from "@/components/features/feed/Post";
import { API_URL } from "@/lib/config";
import { ArrowLeft, Bookmark, X } from "lucide-react"; // Imported X for Close icon
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getUserId, getToken } from "@/lib/auth";

function PostContent({ post }: { post: any }) {
    const [isSaved, setIsSaved] = useState(false);
    const userId = getUserId();
    const token = getToken();

    useEffect(() => {
        // Check if saved
        if (userId && token) {
            fetch(`${ API_URL } /users/${ userId } /saved/${ post.id }/check`, {
headers: { Authorization: `Bearer ${token}` }
            }).then(res => res.json()).then(data => setIsSaved(data.isSaved)).catch(console.error);
        }
    }, [userId, token, post.id]);

const toggleSave = async () => {
    if (!userId || !token) return;

    const newState = !isSaved;
    setIsSaved(newState); // Optimistic

    try {
        await fetch(`${API_URL}/users/${userId}/saved/${post.id}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch (err) {
        setIsSaved(!newState); // Revert
    }
};

return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="relative group">
            <Post post={post} />

            {/* Save Button Overlay */}
            <button
                onClick={toggleSave}
                className={cn(
                    "absolute top-4 right-4 p-2 rounded-full transition-all duration-300 z-10 shadow-lg",
                    isSaved
                        ? "bg-primary text-primary-foreground scale-110"
                        : "bg-background/80 hover:bg-background text-muted-foreground hover:text-primary hover:scale-110"
                )}
            >
                <Bookmark className={cn("h-5 w-5", isSaved && "fill-current")} />
            </button>
        </div>

        <div className="glass-card p-6 border border-border shadow-xl">
            <h3 className="text-lg font-bold mb-4">Comments</h3>
            <CommentSection postId={post.id} initialComments={post.comments} />
        </div>
    </div>
);
}

export default function PostPage(props: { params: Promise<{ id: string }> }) {
    // Need to unwrap params in Next.js 15+ if using async
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();

    // We need to resolve params. In client component, we can user `use()` hook or just fetch client side easier since we are converting to client mostly.
    // However, the original file was trying to be server/client hybrid.
    // Let's stick to full client for simplicity with router.

    useEffect(() => {
        props.params.then(p => {
            fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('localhost', '127.0.0.1') || '${API_URL}'}/posts/${p.id}`)
                .then(res => res.ok ? res.json() : null)
                .then(setPost)
                .finally(() => setLoading(false));
        });
    }, [props.params]);


    if (loading) return <div className="min-h-screen pt-24 text-center">Loading...</div>;
    if (!post) return <div className="min-h-screen pt-24 text-center">Post not found</div>;

    const handleBack = () => {
        router.back();
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 max-w-2xl mx-auto">
            <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
            </button>

            <PostContent post={post} />
        </div>
    );
}
