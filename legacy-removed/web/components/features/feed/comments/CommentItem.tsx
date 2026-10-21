"use client";

import { User as UserIcon } from "lucide-react";
import { Comment } from "../../../../hooks/useComments";

export default function CommentItem({ comment }: { comment: Comment }) {
    return (
        <div className="bg-secondary/20 p-3 rounded-lg text-sm border border-border/50">
            <div className="flex items-center gap-2 mb-1">
                <div className="h-5 w-5 rounded-full bg-secondary/40 flex items-center justify-center">
                    <UserIcon className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="font-bold text-xs opacity-70">
                    {comment.author.email.split('@')[0]}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(comment.createdAt).toLocaleTimeString()}
                </span>
            </div>
            <p className="text-foreground/90 pl-7">{comment.content}</p>
        </div>
    );
}
