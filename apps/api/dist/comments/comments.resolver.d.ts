import { CommentsService } from './comments.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { User } from '../users/entities/user.entity';
export declare class CommentsResolver {
    private readonly commentsService;
    constructor(commentsService: CommentsService);
    createComment(user: User, createCommentInput: CreateCommentInput): import(".prisma/client").Prisma.Prisma__CommentClient<{
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
        content: string;
        authorId: string;
        postId: string;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findAll(postId: string): import(".prisma/client").Prisma.PrismaPromise<({
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
        content: string;
        authorId: string;
        postId: string;
        createdAt: Date;
    })[]>;
}
