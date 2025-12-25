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
        onSubmit = { async(content) => {
            const success = await createComment(content);
            if (success) onCommentAdded?.();
        }
    }
                    isSubmitting = { submitting }
        />
            </div >
        );
}
