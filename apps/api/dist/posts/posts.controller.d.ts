import { PostsService } from './posts.service';
import { CreatePostInput } from './dto/create-post.input';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
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
    getFeed(lat: string, long: string, radius: string, category: string): Promise<(({
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
}
