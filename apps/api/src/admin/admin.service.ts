import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostStatus, ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../common/audit.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAllUsers() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        _count: { select: { posts: true, reports: true } },
      },
    });
  }

  async toggleBlockUser(userId: string, adminId: string, reason?: string) {
    if (userId === adminId)
      throw new BadRequestException('You cannot block your own account');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new NotFoundException('User not found');
    const isBlocked = !user.isBlocked;
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { isBlocked } });
      // A blocked account must not keep receiving pushes on its devices.
      if (isBlocked)
        await tx.deviceToken.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      await this.audit.record(
        adminId,
        isBlocked ? 'BLOCK_ACCOUNT' : 'UNBLOCK_ACCOUNT',
        'USER',
        userId,
        reason,
        tx,
      );
    });
    return { id: userId, isBlocked };
  }

  async getStats() {
    const now = new Date();
    const [totalUsers, pendingReports, activePosts] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.report.count({ where: { status: ReportStatus.PENDING } }),
      this.prisma.post.count({
        where: {
          status: PostStatus.ACTIVE,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
    ]);
    // `activeAlerts` kept for the existing admin dashboard: currently active (non-expired) posts.
    return { totalUsers, activeAlerts: activePosts, pendingReports };
  }

  auditLog(targetType: 'POST' | 'REPORT' | 'USER', targetId: string) {
    return this.audit.forTarget(targetType, targetId);
  }
}
