import { useState } from "react";
import { API_URL } from "@/lib/config";
import { formatDistanceToNow } from "date-fns";

interface PostContentProps {
    content: string;
    imageUrl?: string;
    createdAt: string;
    neighborhoodName?: string;
}

export default function PostContent({ content, imageUrl, createdAt, neighborhoodName }: PostContentProps) {
    return (
        <>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 break-words">{content}</p>
            {imageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden h-32 w-full relative group/img">
                    <img
                        src={imageUrl.startsWith('http') ? imageUrl : `${API_URL}${imageUrl}`}
                        alt="Incident"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <div className="mt-2 text-[10px] text-muted-foreground flex gap-2 items-center">
                <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                <span className="truncate max-w-[120px]">{neighborhoodName || "Unknown Area"}</span>
            </div>
        </>
    );
}
