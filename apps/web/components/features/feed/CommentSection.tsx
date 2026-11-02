"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowUp, MessageCircle } from "lucide-react";
import { useComments } from "../../../hooks/useComments";
import { Avatar, Banner, Skeleton } from "@/components/nn";
import { cn } from "@/lib/utils";

/** Comment thread with an iMessage-style composer. */
export default function CommentSection({ postId, canComment = true }: { postId: string; canComment?: boolean }) {
    const { comments, loading, submitting, error, fetchComments, createComment } = useComments(postId);
    const [text, setText] = useState("");
    const [sendError, setSendError] = useState<string | null>(null);

    useEffect(() => {
        void fetchComments();
    }, [fetchComments]);

    const send = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = text.trim();
        if (!content || submitting) return;
        const err = await createComment(content);
        setSendError(err);
        if (!err) setText("");
    };

    return (
        <section aria-labelledby="comments-title" className="space-y-4">
            <h2 id="comments-title" className="text-[19px] font-bold">
                Comments {comments.length ? <span className="font-normal text-muted-foreground">({comments.length})</span> : null}
            </h2>

            {error ? <Banner tone="warning" message={error} /> : null}

            {loading && !comments.length ? (
                <div className="space-y-3">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-2/3" />
                </div>
            ) : comments.length === 0 ? (
                <p className="flex items-center gap-2 text-[15px] text-muted-foreground">
                    <MessageCircle className="size-4" aria-hidden /> No comments yet.
                </p>
            ) : (
                <ul className="space-y-4">
                    {comments.map((c) => (
                        <li key={c.id} className="flex gap-3">
                            <Avatar src={c.author?.avatar} name={c.author?.name} size={34} />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm">
                                    <span className="font-semibold">{c.author?.name ?? "Deleted user"}</span>
                                    <span className="ml-2 text-xs text-subtle">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                                </p>
                                <p className="mt-0.5 whitespace-pre-line break-words text-[15px] leading-relaxed">{c.content}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {canComment ? (
                <form onSubmit={send} className="space-y-2">
                    <div className="flex items-end gap-2 rounded-[22px] bg-surface-2 p-1.5 pl-4 focus-within:ring-4 focus-within:ring-primary/15">
                        <label htmlFor={`comment-${postId}`} className="sr-only">
                            Add a comment
                        </label>
                        <textarea
                            id={`comment-${postId}`}
                            rows={1}
                            value={text}
                            maxLength={1000}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    void send(e);
                                }
                            }}
                            placeholder="Add a comment"
                            className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent py-2 text-[15px] placeholder:text-subtle focus:outline-none"
                        />
                        <button
                            type="submit"
                            aria-label="Send comment"
                            disabled={!text.trim() || submitting}
                            className={cn("flex size-9 shrink-0 items-center justify-center rounded-full transition-colors", text.trim() ? "bg-primary text-primary-foreground" : "bg-transparent text-subtle")}
                        >
                            <ArrowUp className="size-5" aria-hidden />
                        </button>
                    </div>
                    {sendError ? <p className="px-2 text-[13px] text-danger">{sendError}</p> : null}
                </form>
            ) : null}
        </section>
    );
}
