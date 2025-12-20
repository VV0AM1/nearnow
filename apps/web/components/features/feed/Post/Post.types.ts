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
}

export interface PostProps {
    post: Post;
    onClick?: (post: Post) => void;
}
