import { OnModuleInit } from '@nestjs/common';
import { PostsService } from './posts.service';
export declare class PostsController implements OnModuleInit {
    private readonly postsService;
    private readonly logger;
    constructor(postsService: PostsService);
    onModuleInit(): void;
    findAll(authorId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        neighborhood: {
            id: string;
            name: string;
            cityId: string;
            latitude: number;
            longitude: number;
            radiusKm: number;
            safetyLevel: import(".prisma/client").$Enums.SafetyLevel;
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
            role: import(".prisma/client").$Enums.Role;
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
        category: import(".prisma/client").$Enums.Category;
        latitude: number;
        longitude: number;
        authorId: string;
        neighborhoodId: string | null;
        likes: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getFeed(lat: string, long: string, radius: string, category: string, search: string, page: string, limit: string): Promise<(({
        neighborhood: {
            id: string;
            name: string;
            cityId: string;
            latitude: number;
            longitude: number;
            radiusKm: number;
            safetyLevel: import(".prisma/client").$Enums.SafetyLevel;
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
            role: import(".prisma/client").$Enums.Role;
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
        category: import(".prisma/client").$Enums.Category;
        latitude: number;
        longitude: number;
        authorId: string;
        neighborhoodId: string | null;
        likes: number;
        createdAt: Date;
        updatedAt: Date;
    }) | undefined)[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__PostClient<({
        neighborhood: {
            id: string;
            name: string;
            cityId: string;
            latitude: number;
            longitude: number;
            radiusKm: number;
            safetyLevel: import(".prisma/client").$Enums.SafetyLevel;
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
            role: import(".prisma/client").$Enums.Role;
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
                role: import(".prisma/client").$Enums.Role;
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
        category: import(".prisma/client").$Enums.Category;
        latitude: number;
        longitude: number;
        authorId: string;
        neighborhoodId: string | null;
        likes: number;
        createdAt: Date;
        updatedAt: Date;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    create(body: any, file: Express.Multer.File, req: any): Promise<{
        neighborhood: {
            id: string;
            name: string;
            cityId: string;
            latitude: number;
            longitude: number;
            radiusKm: number;
            safetyLevel: import(".prisma/client").$Enums.SafetyLevel;
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
            role: import(".prisma/client").$Enums.Role;
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
        category: import(".prisma/client").$Enums.Category;
        latitude: number;
        longitude: number;
        authorId: string;
        neighborhoodId: string | null;
        likes: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    vote(id: string, body: {
        userId: string;
        type: 'UP' | 'DOWN';
    }): Promise<{
        voted: boolean;
        author: {
            id: string;
            email: string;
            name: string | null;
            avatar: string | null;
            bio: string | null;
            role: import(".prisma/client").$Enums.Role;
            reputation: number;
            isBlocked: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        id: string;
        title: string;
        content: string | null;
        imageUrl: string | null;
        category: import(".prisma/client").$Enums.Category;
        latitude: number;
        longitude: number;
        authorId: string;
        neighborhoodId: string | null;
        likes: number;
        createdAt: Date;
        updatedAt: Date;
    } | undefined>;
    checkVote(id: string, userId: string): Promise<{
        hasVoted: boolean;
        type: string | undefined;
    }>;
}
