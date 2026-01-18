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
            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 break-words leading-relaxed">{content}</p>
            {imageUrl && (
                <div className="mt-1 rounded-md overflow-hidden h-24 w-full relative group/img">
                    <img
                        src={imageUrl.startsWith('http') ? imageUrl : imageUrl}
                        alt="Incident"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <div className="mt-1 text-[10px] text-muted-foreground flex gap-2 items-center">
                <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                <span className="truncate max-w-[120px]">{neighborhoodName || "Unknown Area"}</span>
            </div>
        </>
    );
}
