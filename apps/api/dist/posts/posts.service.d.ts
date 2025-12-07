import { PrismaService } from '../prisma.service';
import { CreatePostInput } from './dto/create-post.input';
import { Prisma } from '@prisma/client';
import { AppGateway } from '../app.gateway';
export declare class PostsService {
    private prisma;
    private gateway;
    constructor(prisma: PrismaService, gateway: AppGateway);
    create(createPostInput: CreatePostInput, authorId: string): Promise<{
        neighborhood: {
            id: string;
            name: string;
            city: string;
            latitude: number;
            longitude: number;
            radiusKm: number;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        author: {
            id: string;
            email: string;
            name: string | null;
            avatar: string | null;
            bio: string | null;
            password: string | null;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        title: string;
        content: string | null;
        imageUrl: string | null;
        category: import("@prisma/client").$Enums.Category;
        latitude: number;
        longitude: number;
        authorId: string;
        neighborhoodId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Prisma.PrismaPromise<({
        neighborhood: {
            id: string;
            name: string;
            city: string;
            latitude: number;
            longitude: number;
            radiusKm: number;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        author: {
            id: string;
            email: string;
            name: string | null;
            avatar: string | null;
            bio: string | null;
            password: string | null;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        title: string;
        content: string | null;
        imageUrl: string | null;
        category: import("@prisma/client").$Enums.Category;
        latitude: number;
        longitude: number;
        authorId: string;
        neighborhoodId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getFeed(lat: number, long: number, radiusKm: number, category?: string): Promise<(({
        neighborhood: {
            id: string;
            name: string;
            city: string;
            latitude: number;
            longitude: number;
            radiusKm: number;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        author: {
            id: string;
            email: string;
            name: string | null;
            avatar: string | null;
            bio: string | null;
            password: string | null;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        title: string;
        content: string | null;
        imageUrl: string | null;
        category: import("@prisma/client").$Enums.Category;
        latitude: number;
        longitude: number;
        authorId: string;
        neighborhoodId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | undefined)[]>;
}
