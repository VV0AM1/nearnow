import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { postInclude, toPostDto } from '../posts/post-mapper';
import { toSelfUser } from '../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  /** The caller's own profile with activity counts and level. */
  async findProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { posts: true, votes: true, comments: true } },
      },
    });
    if (!user || user.deletedAt) throw new NotFoundException('User not found');

    const points = user.reputation || 0;
    const POINTS_PER_LEVEL = 5;
    const level = Math.floor(points / POINTS_PER_LEVEL) + 1;
    let rank = 'Novice';
    if (level >= 50) rank = 'Platinum';
    else if (level >= 30) rank = 'Gold';
    else if (level >= 15) rank = 'Silver';
    else if (level >= 5) rank = 'Bronze';
    const progress =
      ((points - (level - 1) * POINTS_PER_LEVEL) / POINTS_PER_LEVEL) * 100;

    return {
      ...toSelfUser(user),
      reputation: user.reputation,
      _count: user._count,
      gamification: {
        level,
        rank,
        points,
        nextLevelPoints: level * POINTS_PER_LEVEL,
        progress,
      },
    };
  }

  async updateProfile(
    id: string,
    data: { name?: string; bio?: string | null },
  ) {
    await this.prisma.user.update({ where: { id }, data });
    return this.findProfile(id);
  }

  async updateAvatar(id: string, file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('Choose an image to upload');
    const previous = await this.prisma.user.findUnique({
      where: { id },
      select: { avatar: true },
    });
    const avatar = await this.uploads.storeImage(file);
    await this.prisma.user.update({ where: { id }, data: { avatar } });
    // The storage adapter ignores URLs it does not own (e.g. a Google profile photo).
    await this.uploads.remove(previous?.avatar);
    return this.findProfile(id);
  }

  async getSavedPosts(userId: string) {
    const saved = await this.prisma.savedPost.findMany({
      where: { userId, post: { status: { not: PostStatus.REMOVED } } },
      include: { post: { include: postInclude } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return saved.map((s) => ({
      id: s.id,
      postId: s.postId,
      savedAt: s.createdAt,
      post: toPostDto(s.post, {
        viewer: {
          isAuthor: s.post.authorId === userId,
          hasSaved: true,
          hasVoted: false,
          confirmation: null,
        },
      }),
    }));
  }

  /** Toggles a save for the caller. Idempotent with an explicit desired state. */
  async setSaved(userId: string, postId: string, saved?: boolean) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { status: true },
    });
    if (!post || post.status === PostStatus.REMOVED)
      throw new NotFoundException('Post not found');
    const existing = await this.prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    const want = saved ?? !existing;
    if (want && !existing)
      await this.prisma.savedPost.create({ data: { userId, postId } });
    if (!want && existing)
      await this.prisma.savedPost.delete({ where: { id: existing.id } });
    return { saved: want };
  }

  async isPostSaved(userId: string, postId: string) {
    return (
      (await this.prisma.savedPost.count({ where: { userId, postId } })) > 0
    );
  }

  /**
   * Deletes the caller's account (GDPR erasure). Policy:
   * - posts (with their location, images, comments and votes) are deleted;
   * - the user's comments on other people's posts stay, shown as "Deleted user";
   * - credentials, sessions' backing record, device tokens, alert settings,
   *   notifications, saved items, confirmations, contact requests and blocks are deleted;
   * - the user row is kept only as an anonymised tombstone so foreign keys of
   *   remaining comments/audit entries stay valid. Its email is replaced, so the
   *   address can be registered again.
   */
  async deleteAccount(userId: string) {
    const posts = await this.prisma.post.findMany({
      where: { authorId: userId },
      select: { id: true, imageUrl: true },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    await this.prisma.$transaction(async (tx) => {
      // Undo this user's likes on others' posts so counters stay correct.
      const votes = await tx.postVote.findMany({
        where: { userId, post: { authorId: { not: userId } } },
        select: { postId: true },
      });
      for (const v of votes)
        await tx.post.update({
          where: { id: v.postId },
          data: { likes: { decrement: 1 } },
        });
      await tx.postVote.deleteMany({ where: { userId } });

      await tx.post.deleteMany({ where: { authorId: userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.notificationSettings.deleteMany({ where: { userId } });
      await tx.deviceToken.deleteMany({ where: { userId } });
      await tx.savedPost.deleteMany({ where: { userId } });
      await tx.postConfirmation.deleteMany({ where: { userId } });
      await tx.contactRequest.deleteMany({
        where: { OR: [{ requesterId: userId }, { recipientId: userId }] },
      });
      await tx.userBlock.deleteMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      });
      await tx.lostFoundMatchDismissal.deleteMany({ where: { userId } });
      await tx.auth.deleteMany({ where: { userId } });
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@deleted.invalid`,
          name: null,
          avatar: null,
          bio: null,
          reputation: 0,
          deletedAt: new Date(),
        },
      });
    });

    for (const p of posts) await this.uploads.remove(p.imageUrl);
    await this.uploads.remove(user?.avatar);
    return { deleted: true };
  }
}
