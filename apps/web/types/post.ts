export interface Comment {
    id: string;
    content: string;
    createdAt: string;
    author: {
        id: string;
        name: string;
    };
}

export interface Post {
    id: string;
    title: string;
    content: string;
    category: string;
    imageUrl?: string;
    createdAt: string;
    author?: {
        id: string;
        name: string;
    };
    neighborhood?: {
        id: string;
        name: string;
    };
    comments?: Comment[];
    [key: string]: any;
}
