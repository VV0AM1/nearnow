import { Category } from '@prisma/client';
export declare class CreatePostInput {
    title: string;
    content?: string;
    imageUrl?: string;
    category: Category;
    latitude: number;
    longitude: number;
    neighborhoodId?: string;
    neighborhood?: string;
    city?: string;
    country?: string;
}
