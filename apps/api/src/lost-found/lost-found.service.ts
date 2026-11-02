import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Category,
  ContactRequestStatus,
  LostFoundDirection,
  LostFoundStatus,
  NotificationType,
  PostStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { HOUR, RateLimitService } from '../common/rate-limit.service';
import { AuditService } from '../common/audit.service';
import { boundingBox } from '../common/geo';
import { publicUserSelect, toPublicUser } from '../common/public-user';
import {
  findSensitiveData,
  SENSITIVE_DATA_MESSAGE,
} from '../posts/content-guard';
import { postInclude, PostRecord, toPostDto } from '../posts/post-mapper';
import {
  MATCH_MAX_DISTANCE_KM,
  MATCH_MAX_GAP_DAYS,
  MatchCandidate,
  rankMatches,
} from './matching';
import {
  CreateContactRequestDto,
  RespondContactRequestDto,
} from './dto/lost-found.dto';

const DAY = 24 * HOUR;

function toCandidate(p: PostRecord): MatchCandidate | null {
  if (!p.lostFound) return null;
  return {
    id: p.id,
    direction: p.lostFound.direction,
    itemType: p.lostFound.itemType,
    occurredFrom: p.lostFound.occurredFrom,
    occurredTo: p.lostFound.occurredTo,
    latitude: p.latitude,
    longitude: p.longitude,
    title: p.title,
    content: p.content,
  };
}

@Injectable()
export class LostFoundService {
  private readonly logger = new Logger(LostFoundService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly rateLimit: RateLimitService,
    private readonly audit: AuditService,
  ) {}

  /** Open reports of the opposite direction that could describe the same item. */
  private async candidatesFor(source: PostRecord, excludeAuthorId: string) {
    const lf = source.lostFound!;
    const box = boundingBox(source, MATCH_MAX_DISTANCE_KM);
    const gap = MATCH_MAX_GAP_DAYS * DAY;
    const now = new Date();
    return this.prisma.post.findMany({
      where: {
        id: { not: source.id },
        authorId: { not: excludeAuthorId },
        author: { isBlocked: false, deletedAt: null },
        status: PostStatus.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        latitude: { gte: box.minLat, lte: box.maxLat },
        longitude: { gte: box.minLng, lte: box.maxLng },
        lostFound: {
          direction:
            lf.direction === LostFoundDirection.LOST
              ? LostFoundDirection.FOUND
              : LostFoundDirection.LOST,
          status: LostFoundStatus.OPEN,
          occurredTo: { gte: new Date(lf.occurredFrom.getTime() - gap) },
          occurredFrom: { lte: new Date(lf.occurredTo.getTime() + gap) },
        },
      },
      include: postInclude,
      take: 200,
    });
  }

  private async loadOwnLostFound(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: postInclude,
    });
    if (!post || !post.lostFound || post.status === PostStatus.REMOVED)
      throw new NotFoundException('Lost & found report not found');
    if (post.authorId !== userId)
      throw new ForbiddenException(
        'Only the person who posted this report can see its matches',
      );
    return post;
  }

  /** Possible matches for the caller's own report. Suggestions only — never auto-matched. */
  async findMatches(postId: string, userId: string) {
    const post = await this.loadOwnLostFound(postId, userId);
    if (post.lostFound!.status !== LostFoundStatus.OPEN)
      return { items: [], closed: true };

    const [candidates, dismissed] = await Promise.all([
      this.candidatesFor(post, userId),
      this.prisma.lostFoundMatchDismissal.findMany({
        where: { userId, sourcePostId: postId },
        select: { candidatePostId: true },
      }),
    ]);
    const hidden = new Set(dismissed.map((d) => d.candidatePostId));
    const byId = new Map(candidates.map((c) => [c.id, c]));
    const ranked = rankMatches(
      toCandidate(post)!,
      candidates
        .filter((c) => !hidden.has(c.id))
        .map(toCandidate)
        .filter((c): c is MatchCandidate => !!c),
    ).slice(0, 10);

    return {
      closed: false,
      items: ranked.map((m) => ({
        label: 'Possible match',
        score: m.score,
        reasons: m.reasons,
        post: toPostDto(byId.get(m.candidateId)!, { distanceKm: m.distanceKm }),
      })),
    };
  }

  async dismissMatch(postId: string, candidatePostId: string, userId: string) {
    await this.loadOwnLostFound(postId, userId);
    await this.prisma.lostFoundMatchDismissal.upsert({
      where: {
        userId_sourcePostId_candidatePostId: {
          userId,
          sourcePostId: postId,
          candidatePostId,
        },
      },
      update: {},
      create: { userId, sourcePostId: postId, candidatePostId },
    });
    return { dismissed: true };
  }

  /**
   * After a new lost/found report: tell its author how many possible matches exist and
   * tell each matching report's author once. Capped per person per day.
   */
  async notifyNewMatches(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: postInclude,
    });
    if (!post?.lostFound) return;
    const candidates = await this.candidatesFor(post, post.authorId);
    const ranked = rankMatches(
      toCandidate(post)!,
      candidates.map(toCandidate).filter((c): c is MatchCandidate => !!c),
    );
    if (!ranked.length) return;

    const byId = new Map(candidates.map((c) => [c.id, c]));
    await this.notifications.sendNotification(
      post.authorId,
      NotificationType.MATCH_SUGGESTION,
      'Possible matches found',
      `${ranked.length} report${ranked.length === 1 ? '' : 's'} nearby could match "${post.title}". Open your report to review them.`,
      post.id,
      { dedupe: true, push: true },
    );
    for (const m of ranked.slice(0, 5)) {
      const other = byId.get(m.candidateId)!;
      if (!this.rateLimit.tryConsume(`match-notify:${other.authorId}`, 5, DAY))
        continue;
      await this.notifications.sendNotification(
        other.authorId,
        NotificationType.MATCH_SUGGESTION,
        'A new report may match yours',
        `A new ${post.lostFound.direction === LostFoundDirection.FOUND ? 'found-item' : 'lost-item'} report nearby may match "${other.title}".`,
        other.id,
        { dedupe: true, push: true },
      );
    }
  }

  // --- Contact requests -------------------------------------------------------

  private async isBlocked(blockerId: string, blockedId: string) {
    const b = await this.prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    return !!b;
  }

  async createContactRequest(
    postId: string,
    requesterId: string,
    input: CreateContactRequestDto,
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { lostFound: true },
    });
    if (
      !post ||
      post.status === PostStatus.REMOVED ||
      post.category !== Category.LOST_FOUND
    ) {
      throw new NotFoundException('Lost & found report not found');
    }
    if (post.authorId === requesterId)
      throw new BadRequestException('This is your own report');
    if (
      post.lostFound?.status !== LostFoundStatus.OPEN ||
      post.status !== PostStatus.ACTIVE
    ) {
      throw new BadRequestException('This report is already closed');
    }
    const sensitive = findSensitiveData(input.message);
    if (sensitive)
      throw new BadRequestException(SENSITIVE_DATA_MESSAGE[sensitive]);
    if (await this.isBlocked(post.authorId, requesterId))
      throw new ForbiddenException('You cannot contact this person');

    if (input.relatedPostId) {
      const related = await this.prisma.post.findUnique({
        where: { id: input.relatedPostId },
        select: { authorId: true },
      });
      if (related?.authorId !== requesterId)
        throw new BadRequestException('Related report must be one of your own');
    }

    const pending = await this.prisma.contactRequest.findFirst({
      where: { postId, requesterId, status: ContactRequestStatus.PENDING },
      select: { id: true },
    });
    if (pending)
      throw new BadRequestException(
        'You already have a pending request for this report',
      );
    this.rateLimit.consume(
      `contact:${requesterId}`,
      5,
      HOUR,
      'You have sent several requests recently. Try again later.',
    );

    const req = await this.prisma.contactRequest.create({
      data: {
        postId,
        requesterId,
        recipientId: post.authorId,
        message: input.message,
        relatedPostId: input.relatedPostId ?? null,
      },
    });
    await this.notifications.sendNotification(
      post.authorId,
      NotificationType.CONTACT_REQUEST,
      'New contact request',
      `Someone wants to get in touch about "${post.title}".`,
      post.id,
      { push: true },
    );
    return { id: req.id, status: req.status };
  }

  async listContactRequests(userId: string) {
    const include = {
      requester: { select: publicUserSelect },
      recipient: { select: publicUserSelect },
    } satisfies Prisma.ContactRequestInclude;
    const [incoming, outgoing] = await Promise.all([
      this.prisma.contactRequest.findMany({
        where: { recipientId: userId },
        include,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.contactRequest.findMany({
        where: { requesterId: userId },
        include,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);
    const postIds = [
      ...new Set([...incoming, ...outgoing].map((r) => r.postId)),
    ];
    const posts = await this.prisma.post.findMany({
      where: { id: { in: postIds } },
      select: { id: true, title: true },
    });
    const titles = new Map(posts.map((p) => [p.id, p.title]));

    return {
      incoming: incoming.map((r) => ({
        id: r.id,
        postId: r.postId,
        postTitle: titles.get(r.postId) ?? null,
        from: toPublicUser(r.requester),
        message: r.message,
        status: r.status,
        responseMessage: r.responseMessage,
        createdAt: r.createdAt,
        respondedAt: r.respondedAt,
      })),
      outgoing: outgoing.map((r) => ({
        id: r.id,
        postId: r.postId,
        postTitle: titles.get(r.postId) ?? null,
        to: toPublicUser(r.recipient),
        message: r.message,
        // A block is shown to the requester as a decline.
        status:
          r.status === ContactRequestStatus.BLOCKED
            ? ContactRequestStatus.DECLINED
            : r.status,
        responseMessage:
          r.status === ContactRequestStatus.ACCEPTED ? r.responseMessage : null,
        createdAt: r.createdAt,
        respondedAt: r.respondedAt,
      })),
    };
  }

  async respondToContactRequest(
    id: string,
    userId: string,
    input: RespondContactRequestDto,
  ) {
    const req = await this.prisma.contactRequest.findUnique({ where: { id } });
    if (!req || req.recipientId !== userId)
      throw new NotFoundException('Request not found');
    if (req.status !== ContactRequestStatus.PENDING)
      throw new BadRequestException('This request was already answered');
    if (input.responseMessage) {
      const sensitive = findSensitiveData(input.responseMessage);
      if (sensitive)
        throw new BadRequestException(SENSITIVE_DATA_MESSAGE[sensitive]);
    }

    const status =
      input.action === 'ACCEPT'
        ? ContactRequestStatus.ACCEPTED
        : input.action === 'DECLINE'
          ? ContactRequestStatus.DECLINED
          : ContactRequestStatus.BLOCKED;

    await this.prisma.$transaction(async (tx) => {
      await tx.contactRequest.update({
        where: { id },
        data: {
          status,
          respondedAt: new Date(),
          responseMessage:
            input.action === 'ACCEPT' ? input.responseMessage : null,
        },
      });
      if (status === ContactRequestStatus.BLOCKED) {
        await tx.userBlock.upsert({
          where: {
            blockerId_blockedId: {
              blockerId: userId,
              blockedId: req.requesterId,
            },
          },
          update: {},
          create: { blockerId: userId, blockedId: req.requesterId },
        });
        await this.audit.record(
          userId,
          'BLOCK_USER',
          'USER',
          req.requesterId,
          `contact-request:${id}`,
          tx,
        );
      }
    });

    if (status !== ContactRequestStatus.BLOCKED) {
      await this.notifications.sendNotification(
        req.requesterId,
        NotificationType.CONTACT_REQUEST,
        status === ContactRequestStatus.ACCEPTED
          ? 'Contact request accepted'
          : 'Contact request declined',
        status === ContactRequestStatus.ACCEPTED
          ? 'Open your contact requests to read their reply.'
          : 'The person chose not to continue.',
        req.postId,
        { push: true },
      );
    }
    return { id, status };
  }

  /** Reports an abusive contact request to moderators and blocks the sender. */
  async reportContactRequest(id: string, userId: string, details?: string) {
    const req = await this.prisma.contactRequest.findUnique({ where: { id } });
    if (!req || req.recipientId !== userId)
      throw new NotFoundException('Request not found');
    await this.prisma.$transaction(async (tx) => {
      await tx.report.create({
        data: {
          reporterId: userId,
          postId: req.postId,
          reason: 'HARASSMENT',
          details: `[contact-request:${id}] ${details ?? ''}`.trim(),
        },
      });
      await tx.contactRequest.update({
        where: { id },
        data: {
          status: ContactRequestStatus.BLOCKED,
          respondedAt: req.respondedAt ?? new Date(),
        },
      });
      await tx.userBlock.upsert({
        where: {
          blockerId_blockedId: {
            blockerId: userId,
            blockedId: req.requesterId,
          },
        },
        update: {},
        create: { blockerId: userId, blockedId: req.requesterId },
      });
    });
    this.logger.log(`Contact request ${id} reported`);
    return { reported: true, blocked: true };
  }
}
