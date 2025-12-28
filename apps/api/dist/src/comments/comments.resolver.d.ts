import { CommentsService } from './comments.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { User } from '../users/entities/user.entity';
export declare class CommentsResolver {
    private readonly commentsService;
    constructor(commentsService: CommentsService);
    createComment(user: User, createCommentInput: CreateCommentInput): Promise<{
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
        content: string;
        authorId: string;
        postId: string;
        createdAt: Date;
    }>;
    findAll(postId: string): import(".prisma/client").Prisma.PrismaPromise<({
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
    })[]>;
}
