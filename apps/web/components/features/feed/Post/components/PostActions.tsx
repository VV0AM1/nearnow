import Link from "next/link";
import { MessageCircle, ThumbsUp } from "lucide-react";
import ShareButton from "@/components/common/input/ShareButton";

interface PostActionsProps {
    id: string;
    title: string;
    content: string;
    commentsCount: number;
    likes: number;
    voted: boolean;
    onVote: (e: React.MouseEvent) => void;
}

export default function PostActions({ id, title, content, commentsCount, likes, voted, onVote }: PostActionsProps) {
    return (
        <div className="mt-4 flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-4">
                <button
                    onClick={onVote}
                    className={`flex items-center space-x-1 transition-colors ${voted ? 'text-primary' : 'hover:text-primary'}`}
                >
                    <ThumbsUp className={`h-4 w-4 ${voted ? 'fill-current' : ''}`} />
                    <span className="text-xs font-medium">{likes > 0 ? likes : 'Helpful'}</span>
                </button>

                <Link href={`/post/${id}`} className="flex items-center space-x-2 hover:text-primary transition-colors">
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-sm">{commentsCount || 0}</span>
                </Link>
            </div>
            <ShareButton postId={id} title={title} text={content} />
        </div>
    );
}
