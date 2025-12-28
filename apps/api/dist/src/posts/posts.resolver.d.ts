import { PostsService } from './posts.service';
import { CreatePostInput } from './dto/create-post.input';
import { User } from '../users/entities/user.entity';
export declare class PostsResolver {
    private readonly postsService;
    constructor(postsService: PostsService);
    createPost(user: User, createPostInput: CreatePostInput): Promise<{
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
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
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
    feed(latitude: number, longitude: number, radius: number): Promise<(({
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
}
