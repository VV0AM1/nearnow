"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

interface ShareButtonProps {
    postId: string;
    title: string;
    text: string;
}

export default function ShareButton({ postId, title, text }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening post details

        const url = `${window.location.origin}/post/${postId}`;

        // Use Web Share API if available
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `NearNow: ${title}`,
                    text: text,
                    url: url
                });
                return;
            } catch (err) {
                // User cancelled or not supported, fall back to clipboard
                console.log("Share failed/cancelled", err);
            }
        }

        // Fallback: Copy to Clipboard
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy", err);
        }
    };

    return (
        <button
            onClick={handleShare}
            className={`flex items-center space-x-2 transition-colors ${copied ? 'text-green-500' : 'hover:text-primary'}`}
            title="Share this post"
        >
            {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            <span className="text-sm">{copied ? "Copied!" : "Share"}</span>
        </button>
    );
}
