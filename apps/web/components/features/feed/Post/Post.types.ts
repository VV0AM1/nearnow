export interface Post {
    id: string;
    title: string;
    content: string;
    category: string;
    latitude: number;
    longitude: number;
    createdAt: string;
    likes: number;
    user?: {
        name: string;
        avatar?: string;
    };
    neighborhood?: {
        name: string;
    };
    imageUrl?: string;
    comments?: any[];
    author?: { id: string; name: string; avatar?: string | null } | null;
    status?: "ACTIVE" | "RESOLVED" | "EXPIRED" | "REMOVED";
    isStale?: boolean;
    verificationStatus?: "UNVERIFIED" | "COMMUNITY_CONFIRMED" | "OFFICIAL_SOURCE";
    confirmations?: { stillHappening: number; noLongerPresent: number };
    commentCount?: number;
    viewer?: { isAuthor: boolean; hasVoted: boolean; hasSaved: boolean; confirmation: string | null };
}

export interface PostProps {
    post: Post;
    onClick?: (post: Post) => void;
}
