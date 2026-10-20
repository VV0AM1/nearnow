import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, PostStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MINUTE, RateLimitService } from '../common/rate-limit.service';
import { publicUserSelect, toPublicUser } from '../common/public-user';
import {
  findSensitiveData,
  SENSITIVE_DATA_MESSAGE,
} from '../posts/content-guard';
import { CreateCommentInput } from './dto/create-comment.input';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly rateLimit: RateLimitService,
  ) {}

  private toDto(c: {
    id: string;
    content: string;
    createdAt: Date;
    postId: string;
    author: Parameters<typeof toPublicUser>[0];
  }) {
    return {
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      postId: c.postId,
      author: toPublicUser(c.author),
    };
  }

  async create(userId: string, input: CreateCommentInput) {
    this.rateLimit.consume(
      `comment:${userId}`,
      20,
      10 * MINUTE,
      'You are commenting too quickly. Please wait a moment.',
    );
    const post = await this.prisma.post.findUnique({
      where: { id: input.postId },
      select: { id: true, title: true, authorId: true, status: true },
    });
    if (!post || post.status === PostStatus.REMOVED)
      throw new NotFoundException('Post not found');
    const sensitive = findSensitiveData(input.content);
    if (sensitive)
      throw new BadRequestException(SENSITIVE_DATA_MESSAGE[sensitive]);

    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: { content: input.content, postId: post.id, authorId: userId },
        include: { author: { select: publicUserSelect } },
      });
      await tx.user.update({
        where: { id: userId },
        data: { reputation: { increment: 2 } },
      });
      return created;
    });

    // At most one comment notification per post per 10 minutes, so busy threads don't spam the author.
    if (
      post.authorId !== userId &&
      this.rateLimit.tryConsume(`notify-comment:${post.id}`, 1, 10 * MINUTE)
    ) {
      await this.notificationsService.sendNotification(
        post.authorId,
        NotificationType.COMMENT,
        'New comment',
        `${comment.author.name || 'Someone'} commented on "${post.title}"`,
        post.id,
        { push: true },
      );
    }
    return this.toDto(comment);
  }

  async findByPostId(postId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { postId, post: { status: { not: PostStatus.REMOVED } } },
      include: { author: { select: publicUserSelect } },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
    return comments.map((c) => this.toDto(c));
  }
}
