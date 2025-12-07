import { PostsService } from './posts.service';
import { CreatePostInput } from './dto/create-post.input';
import { User } from '../users/entities/user.entity';
export declare class PostsResolver {
    private readonly postsService;
    constructor(postsService: PostsService);
    createPost(user: User, createPostInput: CreatePostInput): Promise<{
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
            role: import(".prisma/client").$Enums.Role;
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
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
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
            role: import(".prisma/client").$Enums.Role;
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
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    feed(latitude: number, longitude: number, radius: number): Promise<(({
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
            role: import(".prisma/client").$Enums.Role;
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
        createdAt: Date;
        updatedAt: Date;
    }) | undefined)[]>;
}
