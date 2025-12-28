import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
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
    uploadAvatar(file: Express.Multer.File, req: any): Promise<{
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
    }>;
    getSavedPosts(id: string): Promise<({
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
    checkSavedStatus(userId: string, postId: string): Promise<{
        isSaved: boolean;
    }>;
}
