import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCommentInput } from './dto/create-comment.input';

@Injectable()
export class CommentsService {
    constructor(private prisma: PrismaService) { }

    create(userId: string, createCommentInput: CreateCommentInput) {
        return this.prisma.comment.create({
            data: {
                content: createCommentInput.content,
                postId: createCommentInput.postId,
                authorId: userId,
            },
            include: {
                author: true,
            },
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
