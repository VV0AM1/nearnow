import { PrismaService } from '../prisma.service';
import { CreateCommentInput } from './dto/create-comment.input';
export declare class CommentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, createCommentInput: CreateCommentInput): import(".prisma/client").Prisma.Prisma__CommentClient<{
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
    findByPostId(postId: string): import(".prisma/client").Prisma.PrismaPromise<({
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
