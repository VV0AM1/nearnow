"use client";

import { useEffect } from "react";
import { useComments } from "../../../hooks/useComments";
import CommentList from "./comments/CommentList";
import CreateCommentForm from "./comments/CreateCommentForm";

interface CommentSectionProps {
    postId: string;
    initialComments?: any[];
    onCommentAdded?: () => void;
}

export default function CommentSection({ postId, initialComments, onCommentAdded }: CommentSectionProps) {
    const { comments, loading, submitting, fetchComments, createComment, setComments } = useComments(postId);

    useEffect(() => {
        if (initialComments && initialComments.length > 0) {
            setComments(initialComments);
        } else {
            fetchComments();
        }
    }, []); // Run once on mount

    return (
        <div className="mt-4 space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Comments ({comments.length})</h3>
            <CommentList comments={comments} loading={loading} />
            <CreateCommentForm
                onSubmit={async (content) => {
                    const success = await createComment(content);
                    if (success) onCommentAdded?.();
                }}
                isSubmitting={submitting}
            />
        </div>
    );
}
