import { Role, Category } from '@prisma/client';
export declare class User {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    bio?: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
    posts?: any[];
}
export declare class Post {
    id: string;
    title: string;
    content?: string;
    imageUrl?: string;
    category: Category;
    latitude: number;
    longitude: number;
    authorId: string;
    author: User;
    neighborhoodId?: string;
    neighborhood?: any;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Neighborhood {
    id: string;
    name: string;
    city: string;
    latitude: number;
    longitude: number;
    radiusKm: number;
    posts?: Post[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class Comment {
    id: string;
    content: string;
    authorId: string;
    author: User;
    postId: string;
    createdAt: Date;
}
export declare class AuthResponse {
    accessToken: string;
    user: User;
}
