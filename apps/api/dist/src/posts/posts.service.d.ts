import { PrismaService } from '../prisma.service';
import { CreatePostInput } from './dto/create-post.input';
import { Prisma } from '@prisma/client';
import { AppGateway } from '../app.gateway';
import { NotificationsService } from '../notifications/notifications.service';
export declare class PostsService {
    private prisma;
    private gateway;
    private notificationsService;
    constructor(prisma: PrismaService, gateway: AppGateway, notificationsService: NotificationsService);
    private isProfane;
    create(createPostInput: CreatePostInput, authorId: string, imageUrl?: string): Promise<{
        neighborhood: {
            id: string;
            name: string;
            cityId: string;
            latitude: number;
            longitude: number;
            radiusKm: number;
            safetyLevel: import("@prisma/client").$Enums.SafetyLevel;
            crimeCount: number;
            safetyCount: number;
            totalCount: number;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        author: {
            id: string;
            email: string;
            name: string | null;
            avatar: string | null;
            bio: string | null;
            role: import("@prisma/client").$Enums.Role;
            reputation: number;
            isBlocked: boolean;
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
        likes: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(authorId?: string): Prisma.PrismaPromise<({
        neighborhood: {
            id: string;
            name: string;
            cityId: string;
            latitude: number;
            longitude: number;
            radiusKm: number;
            safetyLevel: import("@prisma/client").$Enums.SafetyLevel;
            crimeCount: number;
            safetyCount: number;
            totalCount: number;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        author: {
            id: string;
            email: string;
            name: string | null;
            avatar: string | null;
            bio: string | null;
            role: import("@prisma/client").$Enums.Role;
            reputation: number;
            isBlocked: boolean;
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
        likes: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getFeed(lat: number, long: number, radiusKm: number, category?: string, search?: string, page?: number, limit?: number): Promise<(({
        neighborhood: {
            id: string;
            name: string;
            cityId: string;
            latitude: number;
            longitude: number;
            radiusKm: number;
            safetyLevel: import("@prisma/client").$Enums.SafetyLevel;
            crimeCount: number;
            safetyCount: number;
            totalCount: number;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        author: {
            id: string;
            email: string;
            name: string | null;
            avatar: string | null;
            bio: string | null;
            role: import("@prisma/client").$Enums.Role;
            reputation: number;
            isBlocked: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        comments: {
            id: string;
            content: string;
            authorId: string;
            postId: string;
            createdAt: Date;
        }[];
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
        likes: number;
        createdAt: Date;
        updatedAt: Date;
    }) | undefined)[]>;
    findOne(id: string): Prisma.Prisma__PostClient<({
        neighborhood: {
            id: string;
            name: string;
            cityId: string;
            latitude: number;
            longitude: number;
            radiusKm: number;
            safetyLevel: import("@prisma/client").$Enums.SafetyLevel;
            crimeCount: number;
            safetyCount: number;
            totalCount: number;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        author: {
            id: string;
            email: string;
            name: string | null;
            avatar: string | null;
            bio: string | null;
            role: import("@prisma/client").$Enums.Role;
            reputation: number;
            isBlocked: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        comments: ({
            author: {
                id: string;
                email: string;
                name: string | null;
                avatar: string | null;
                bio: string | null;
                role: import("@prisma/client").$Enums.Role;
                reputation: number;
                isBlocked: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            content: string;
            authorId: string;
            postId: string;
            createdAt: Date;
        })[];
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
        likes: number;
        createdAt: Date;
        updatedAt: Date;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    vote(postId: string, userId: string, type: 'UP' | 'DOWN'): Promise<{
        voted: boolean;
        author: {
            id: string;
            email: string;
            name: string | null;
            avatar: string | null;
            bio: string | null;
            role: import("@prisma/client").$Enums.Role;
            reputation: number;
            isBlocked: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        id: string;
        title: string;
        content: string | null;
        imageUrl: string | null;
        category: import("@prisma/client").$Enums.Category;
        latitude: number;
        longitude: number;
        authorId: string;
        neighborhoodId: string | null;
        likes: number;
        createdAt: Date;
        updatedAt: Date;
    } | undefined>;
    checkVoteStatus(postId: string, userId: string): Promise<{
        hasVoted: boolean;
        type: string | undefined;
    }>;
}
