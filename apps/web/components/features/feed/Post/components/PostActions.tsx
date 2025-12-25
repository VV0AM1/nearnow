import Link from "next/link";
import { MessageCircle, ThumbsUp, MoreVertical, Flag } from "lucide-react";
import ShareButton from "@/components/common/input/ShareButton";
import { useState } from "react";
import ReportModal from "@/components/features/reports/ReportModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    return (
        <>
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

                <div className="flex items-center gap-2">
                    <ShareButton postId={id} title={title} text={content} />

                    <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 hover:bg-white/5 rounded-full outline-none">
                            <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsReportModalOpen(true);
                                }}
                                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer gap-2"
                            >
                                <Flag className="h-4 w-4" />
                                Report
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                postId={id}
            />
        </>
    );
}
