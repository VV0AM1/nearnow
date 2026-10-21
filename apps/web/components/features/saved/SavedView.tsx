"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Banner, Button, Card, EmptyState, PageHeader } from "@/components/nn";
import { PostCard, PostCardSkeleton } from "@/components/features/feed/PostCard";
import type { Post } from "@/components/features/feed/Post/Post.types";

const STEP = 10;

export default function SavedView() {
    const [posts, setPosts] = useState<Post[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [shown, setShown] = useState(STEP);

    useEffect(() => {
        if (!getToken()) return setPosts([]);
        apiFetch<{ post: Post }[]>("/users/me/saved")
            .then((rows) => setPosts(rows.map((r) => r.post).filter(Boolean)))
            .catch((e: Error) => setError(e.message));
    }, []);

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <PageHeader title="Saved" subtitle="Posts you bookmarked, newest saved first." />
            {error ? (
                <Banner tone="warning" message={error} />
            ) : posts === null ? (
                <div className="space-y-4">
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                </div>
            ) : posts.length === 0 ? (
                <Card>
                    <EmptyState icon={Bookmark} title="No saved posts yet" body="Tap the bookmark on a post to keep it here." action={<Button href="/">Browse the feed</Button>} />
                </Card>
            ) : (
                <div className="space-y-4">
                    {posts.slice(0, shown).map((p) => (
                        <PostCard key={p.id} post={p} />
                    ))}
                    {shown < posts.length ? (
                        <Button variant="tinted" block onClick={() => setShown((n) => n + STEP)}>
                            Show more
                        </Button>
                    ) : null}
                </div>
            )}
        </div>
    );
}
