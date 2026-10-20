import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostStatus, ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { HOUR, RateLimitService } from '../common/rate-limit.service';
import { AuditService } from '../common/audit.service';
import { CreateReportInput } from './dto/create-report.input';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimit: RateLimitService,
    private readonly audit: AuditService,
  ) {}

  /** Files an abuse report for moderators. One open report per person per post. */
  async create(input: CreateReportInput, reporterId: string) {
    this.rateLimit.consume(
      `report:${reporterId}`,
      10,
      HOUR,
      'You have sent many reports recently. Moderators will review them.',
    );
    const post = await this.prisma.post.findUnique({
      where: { id: input.postId },
      select: { authorId: true, status: true },
    });
    if (!post || post.status === PostStatus.REMOVED)
      throw new NotFoundException('Post not found');
    if (post.authorId === reporterId)
      throw new BadRequestException('You cannot report your own post');

    const existing = await this.prisma.report.findFirst({
      where: { postId: input.postId, reporterId, status: ReportStatus.PENDING },
      select: { id: true },
    });
    if (existing)
      throw new ConflictException(
        'You already reported this post. Moderators will review it.',
      );

    const report = await this.prisma.report.create({
      data: {
        reason: input.reason,
        details: input.details ?? null,
        postId: input.postId,
        reporterId,
      },
    });
    return {
      id: report.id,
      status: report.status,
      message: 'Thanks — moderators will review this report.',
    };
  }

  listPending() {
    return this.prisma.report.findMany({
      where: { status: ReportStatus.PENDING },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            content: true,
            imageUrl: true,
            status: true,
            authorId: true,
          },
        },
        reporter: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async review(reportId: string, moderatorId: string, status: ReportStatus) {
    if (status === ReportStatus.PENDING)
      throw new BadRequestException('Choose RESOLVED or DISMISSED');
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id: reportId },
        data: { status, reviewedById: moderatorId, reviewedAt: new Date() },
      });
      await this.audit.record(
        moderatorId,
        `REPORT_${status}`,
        'REPORT',
        reportId,
        null,
        tx,
      );
      return updated;
    });
  }
}
