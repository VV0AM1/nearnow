"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Check, Flag, Map as MapIcon, MessageCircle, Share2, ThumbsUp } from "lucide-react";
import { mediaUrl } from "@/lib/api";
import { getCategory } from "@/config/categories";
import { Card, Skeleton } from "@/components/nn";
import { Tilt } from "@/components/motion";
import ReportModal from "@/components/features/reports/ReportModal";
import { usePostInteractions } from "./Post/usePostInteractions";
import { CategoryBadge, ITEM_TYPE_LABEL, TrustLine } from "./PostStatus";
import type { Post } from "./Post/Post.types";
import { cn } from "@/lib/utils";

function Action({ icon: IconC, label, count, active, onClick, href }: { icon: typeof ThumbsUp; label: string; count?: number; active?: boolean; onClick?: (e: React.MouseEvent) => void; href?: string }) {
    const cls = cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors",
        active ? "text-primary hover:bg-primary-soft" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
    );
    const inner = (
        <>
            <IconC className={cn("size-[18px]", active && "fill-current")} aria-hidden />
            {count !== undefined ? <span className="tabular-nums">{count}</span> : null}
        </>
    );
    if (href)
        return (
            <Link href={href} aria-label={count !== undefined ? `${label}, ${count}` : label} className={cls} onClick={(e) => e.stopPropagation()}>
                {inner}
            </Link>
        );
    return (
        <button type="button" aria-label={count !== undefined ? `${label}, ${count}` : label} aria-pressed={active} onClick={onClick} className={cls}>
            {inner}
        </button>
    );
}

/** Feed card: category, title, text, photo, trust line, place; helpful/comment/save/share/report. */
function PostCardInner({ post, onHover, compact }: { post: Post; onHover?: (id: string | null) => void; compact?: boolean }) {
    const router = useRouter();
    const { likes, voted, saved, handleVote, handleSave } = usePostInteractions(post);
    const [reporting, setReporting] = useState(false);
    const [copied, setCopied] = useState(false);
    const image = mediaUrl(post.imageUrl);
    const inactive = post.status && post.status !== "ACTIVE";
    const href = `/post/${post.id}`;
    const comments = post.commentCount ?? post.comments?.length ?? 0;

    const place = [
        post.neighborhood?.name,
        post.distanceKm !== undefined ? `${post.distanceKm < 1 ? post.distanceKm.toFixed(1) : Math.round(post.distanceKm)} km away` : null,
        post.isApproximateLocation ? "approximate location" : null,
        post.author ? `by ${post.author.name}` : null,
    ].filter(Boolean);

    const share = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}${href}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: `NearNow: ${post.title}`, url });
                return;
            } catch {
                // cancelled: fall back to copying
            }
        }
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // clipboard unavailable
        }
    };

    return (
        <Tilt max={3} scale={1.006} className="rounded-[22px]">
        <Card padded={false} as="article" className={cn("group relative overflow-hidden transition-shadow duration-300 hover:shadow-[var(--shadow-deep)]", inactive && "opacity-80")}>
            <span aria-hidden className="absolute inset-y-4 left-0 w-[4px] rounded-r-full" style={{ background: getCategory(post.category).hex }} />
            <div
                role="link"
                tabIndex={0}
                aria-label={post.title}
                onClick={() => router.push(href)}
                onKeyDown={(e) => e.key === "Enter" && router.push(href)}
                onMouseEnter={() => onHover?.(post.id)}
                onMouseLeave={() => onHover?.(null)}
                className="cursor-pointer space-y-3 p-5 pb-3 outline-none focus-visible:rounded-t-[20px] focus-visible:ring-2 focus-visible:ring-primary"
            >
                <div className="flex items-center justify-between gap-2">
                    <CategoryBadge category={post.category} />
                    {post.lostFound ? (
                        <span className="text-[13px] font-semibold text-muted-foreground">
                            {post.lostFound.direction === "LOST" ? "Lost" : "Found"} · {ITEM_TYPE_LABEL[post.lostFound.itemType] ?? post.lostFound.itemType}
                        </span>
                    ) : null}
                </div>
                <h3 className="display text-[22px] leading-[1.15]">{post.title}</h3>
                {post.content ? <p className={cn("whitespace-pre-line break-words text-[15px] leading-relaxed text-muted-foreground", compact ? "line-clamp-2" : "line-clamp-3")}>{post.content}</p> : null}
                {image && !compact ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" loading="lazy" className="aspect-[16/9] w-full rounded-[14px] bg-surface-2 object-cover" />
                ) : null}
                <TrustLine post={post} />
                {place.length ? <p className="truncate text-[13px] text-muted-foreground">{place.join(" · ")}</p> : null}
            </div>
            <div className="mx-3 flex items-center justify-between border-t border-border py-1.5">
                <div className="flex items-center">
                    <Action icon={ThumbsUp} label="Helpful" count={likes} active={voted} onClick={handleVote} />
                    <Action icon={MessageCircle} label="Comments" count={comments} href={href} />
                    <Action icon={MapIcon} label="View on map" href={`/map?focus=${post.id}&lat=${post.latitude}&lng=${post.longitude}`} />
                </div>
                <div className="flex items-center">
                    <Action icon={Bookmark} label={saved ? "Remove from saved" : "Save"} active={saved} onClick={handleSave} />
                    <Action icon={copied ? Check : Share2} label={copied ? "Link copied" : "Share"} onClick={share} />
                    {!post.viewer?.isAuthor ? (
                        <Action
                            icon={Flag}
                            label="Report"
                            onClick={(e) => {
                                e.stopPropagation();
                                setReporting(true);
                            }}
                        />
                    ) : null}
                </div>
            </div>
            <ReportModal isOpen={reporting} onClose={() => setReporting(false)} postId={post.id} />
        </Card>
        </Tilt>
    );
}

export const PostCard = memo(PostCardInner);

export function PostCardSkeleton() {
    return (
        <Card className="space-y-3" padded>
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
        </Card>
    );
}

/** Small colour dot + shape for list rows and legends. */
export function CategoryDot({ category }: { category: string }) {
    const c = getCategory(category);
    return (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px]" style={{ backgroundColor: `${c.hex}22` }}>
            <c.icon className="size-4" style={{ color: c.hex }} aria-hidden />
        </span>
    );
}
