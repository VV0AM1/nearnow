import { Category } from '@prisma/client';
export declare class Post {
    id: string;
    title: string;
    content?: string;
    imageUrl?: string;
    category: Category;
    latitude: number;
    longitude: number;
    authorId: string;
    neighborhoodId?: string;
    createdAt: Date;
    updatedAt: Date;
}
