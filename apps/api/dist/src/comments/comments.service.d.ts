import { PrismaService } from '../prisma.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { NotificationsService } from '../notifications/notifications.service';
export declare class CommentsService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    create(userId: string, createCommentInput: CreateCommentInput): Promise<{
        author: {
            id: string;
            email: string;
            name: string | null;
            avatar: string | null;
            bio: string | null;
            role: import(".prisma/client").$Enums.Role;
            reputation: number;
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
    findByPostId(postId: string): import(".prisma/client").Prisma.PrismaPromise<({
        author: {
            id: string;
            email: string;
            name: string | null;
            avatar: string | null;
            bio: string | null;
            role: import(".prisma/client").$Enums.Role;
            reputation: number;
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
