"use client";

import { formatDistanceToNow } from "date-fns";
import { Ban, Building2, CheckCheck, Hourglass, MinusCircle, Timer } from "lucide-react";
import { getCategory } from "@/config/categories";
import { Badge } from "@/components/nn";
import type { Post } from "./Post/Post.types";

export const ITEM_TYPE_LABEL: Record<string, string> = {
    KEYS: "Keys",
    WALLET_BAG: "Wallet or bag",
    ELECTRONICS: "Phone or electronics",
    DOCUMENT: "ID or document",
    PET: "Pet",
    CLOTHING: "Clothing",
    OTHER: "Other",
};

export function CategoryBadge({ category }: { category: string }) {
    const c = getCategory(category);
    return <Badge label={c.label} icon={c.icon} color={c.hex} />;
}

const ago = (iso?: string | null) => (iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : "");

/**
 * Source + freshness + verification, shown the same on cards, map and detail.
 * Text and icons, never colour alone. There are no "safe" labels.
 */
export function TrustLine({ post }: { post: Post }) {
    const badges = [];
    if (post.status === "RESOLVED") badges.push(<Badge key="r" icon={CheckCheck} label="Resolved" tone="success" />);
    else if (post.status === "EXPIRED") badges.push(<Badge key="e" icon={Timer} label="Expired" />);
    else if (post.status === "REMOVED") badges.push(<Badge key="x" icon={Ban} label="Removed" tone="danger" />);
    else if (post.isStale) badges.push(<Badge key="s" icon={Hourglass} label="May be outdated" tone="warning" />);

    if (post.verificationStatus === "OFFICIAL_SOURCE" && post.source?.name) badges.push(<Badge key="o" icon={Building2} label={`Official: ${post.source.name}`} tone="accent" />);
    else if (post.verificationStatus === "COMMUNITY_CONFIRMED")
        badges.push(<Badge key="c" icon={CheckCheck} label={`Confirmed by ${post.confirmations?.stillHappening ?? 0}`} tone="accent" />);
    if (post.status === "ACTIVE" && (post.confirmations?.noLongerPresent ?? 0) > 0)
        badges.push(<Badge key="n" icon={MinusCircle} label={`${post.confirmations?.noLongerPresent} say it's over`} />);

    return (
        <div className="space-y-2">
            <p className="text-[13px] text-muted-foreground">
                {post.verificationStatus === "OFFICIAL_SOURCE" ? "" : "Community report · "}
                {ago(post.createdAt)}
                {post.lastConfirmedAt ? ` · ✓ confirmed ${ago(post.lastConfirmedAt)}` : ""}
            </p>
            {badges.length ? <div className="flex flex-wrap gap-1.5">{badges}</div> : null}
        </div>
    );
}
