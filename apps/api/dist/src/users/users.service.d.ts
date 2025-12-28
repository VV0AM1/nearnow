import { PrismaService } from '../prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createUserInput: CreateUserInput): import(".prisma/client").Prisma.Prisma__UserClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
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
    }[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__UserClient<{
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
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    findProfile(id: string): Promise<{
        gamification: {
            level: number;
            rank: string;
            points: number;
            nextLevelPoints: number;
            progress: number;
        };
        _count: {
            posts: number;
            comments: number;
            votes: number;
        };
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
    } | null>;
    update(id: string, updateUserInput: UpdateUserInput): import(".prisma/client").Prisma.Prisma__UserClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__UserClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    getSavedPosts(userId: string): Promise<({
        post: {
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
        };
    } & {
        id: string;
        userId: string;
        postId: string;
        createdAt: Date;
    })[]>;
    toggleSavedPost(userId: string, postId: string): Promise<{
        saved: boolean;
    }>;
    isPostSaved(userId: string, postId: string): Promise<boolean>;
}
