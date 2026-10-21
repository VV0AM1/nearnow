"use client";

import { Loader2 } from "lucide-react";
import { Comment } from "../../../../hooks/useComments";
import CommentItem from "./CommentItem";

interface CommentListProps {
    comments: Comment[];
    loading: boolean;
}

export default function CommentList({ comments, loading }: CommentListProps) {
    if (loading) {
        return <div className="text-center py-4"><Loader2 className="animate-spin h-5 w-5 mx-auto text-muted-foreground" /></div>;
    }

    if (comments.length === 0) {
        return <p className="text-center text-xs text-muted-foreground py-4">No comments yet. Be the first!</p>;
    }

    return (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
            ))}
        </div>
    );
}
