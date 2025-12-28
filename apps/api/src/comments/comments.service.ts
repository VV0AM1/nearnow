import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCommentInput } from './dto/create-comment.input';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
    ) { }

    create(userId: string, createCommentInput: CreateCommentInput) {
        return this.prisma.$transaction(async (tx) => {
            const comment = await tx.comment.create({
                data: {
                    content: createCommentInput.content,
                    postId: createCommentInput.postId,
                    authorId: userId,
                },
                include: {
                    author: true,
                    post: true
                },
            });

            // Award 2 points for commenting
            await tx.user.update({
                where: { id: userId },
                data: { reputation: { increment: 2 } }
            });

            // Notify Post Author (if not self)
            if (comment.post.authorId !== userId) {
                // We need to call NotificationsService here. Since it's outside transaction usually (to emit socket), we can do it after or use a robust queue.
                // For MVP, we'll try to find a way to invoke it.
                // Since we are inside a method, `this.notificationsService` is available.
            }

            return comment;
        }).then(async (comment) => {
            if (comment.post.authorId !== userId) {
                await this.notificationsService.sendNotification(
                    comment.post.authorId,
                    'INFO', // Or specific COMMENT_CREATED type if we add it
                    'New Comment',
                    `${comment.author.name || 'Someone'} commented on: ${comment.post.title}`,
                    comment.postId
                );
            }
            return comment;
        });
    }

    findByPostId(postId: string) {
        return this.prisma.comment.findMany({
            where: { postId },
            include: {
                author: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }
}
