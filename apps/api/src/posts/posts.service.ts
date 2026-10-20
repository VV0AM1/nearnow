import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  Category,
  ConfirmationState,
  LostFoundStatus,
  NotificationType,
  PostStatus,
  Prisma,
  Role,
  User,
} from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { AppGateway } from '../app.gateway';
import {
  NotificationsService,
  AlertSummary,
} from '../notifications/notifications.service';
import { LostFoundService } from '../lost-found/lost-found.service';
import { UploadsService } from '../uploads/uploads.service';
import { GeocodingService } from '../geocoding/geocoding.service';
import { AuditService } from '../common/audit.service';
import { HOUR, MINUTE, RateLimitService } from '../common/rate-limit.service';
import { approximateCoordinate, boundingBox, distanceKm } from '../common/geo';
import { findSensitiveData, SENSITIVE_DATA_MESSAGE } from './content-guard';
import {
  CONFIRMATION_COOLDOWN_MS,
  CONFIRMATION_WINDOW_MS,
  effectiveStatus,
  expiryFor,
  verificationFor,
} from './post-lifecycle';
import {
  postInclude,
  PostDto,
  PostRecord,
  toPostDto,
  ViewerState,
} from './post-mapper';
import { CreatePostDto, FeedQueryDto, TIME_WINDOWS } from './dto/post.dto';

const DAY = 24 * HOUR;
const isModerator = (u?: User | null) =>
  u?.role === Role.ADMIN || u?.role === Role.MODERATOR;
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

@Injectable()
export class PostsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostsService.name);
  private retentionTimer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: AppGateway,
    private readonly notifications: NotificationsService,
    private readonly lostFound: LostFoundService,
    private readonly uploads: UploadsService,
    private readonly geocoding: GeocodingService,
    private readonly audit: AuditService,
    private readonly rateLimit: RateLimitService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    this.retentionTimer = setInterval(
      () => void this.coarsenExpiredUrgentLocations(),
      15 * MINUTE,
    );
    this.retentionTimer.unref();
  }

  onModuleDestroy() {
    if (this.retentionTimer) clearInterval(this.retentionTimer);
  }

  /**
   * Retention: once an urgent help request has expired, its precise position is no
   * longer needed. Round it to ~1 km so the stored record no longer pinpoints anyone.
   */
  async coarsenExpiredUrgentLocations(now = new Date()) {
    const expired = await this.prisma.post.findMany({
      where: {
        category: Category.DANGER,
        expiresAt: { lt: now },
        isApproximateLocation: false,
      },
      select: { id: true, latitude: true, longitude: true },
      take: 500,
    });
    for (const p of expired) {
      await this.prisma.post.update({
        where: { id: p.id },
        data: {
          latitude: approximateCoordinate(p.latitude, 1000),
          longitude: approximateCoordinate(p.longitude, 1000),
          isApproximateLocation: true,
        },
      });
    }
    return expired.length;
  }

  // --- Create ------------------------------------------------------------------

  async create(
    input: CreatePostDto,
    author: User,
    file?: Express.Multer.File,
  ): Promise<PostDto & { alertSummary?: AlertSummary }> {
    const urgent = input.category === Category.DANGER;
    this.rateLimit.consume(
      `post:${author.id}`,
      10,
      HOUR,
      'You have posted a lot recently. Please try again later.',
    );
    if (urgent) {
      this.rateLimit.consume(
        `urgent:${author.id}`,
        3,
        HOUR,
        'You have sent several urgent requests this hour. If you are in danger, call 112.',
      );
    }

    const sensitive =
      findSensitiveData(input.title) ?? findSensitiveData(input.content);
    if (sensitive)
      throw new BadRequestException(SENSITIVE_DATA_MESSAGE[sensitive]);

    const lostFound =
      input.category === Category.LOST_FOUND
        ? this.lostFoundWindow(input)
        : null;

    const approximate = !!input.approximateLocation;
    const latitude = approximate
      ? approximateCoordinate(input.latitude)
      : input.latitude;
    const longitude = approximate
      ? approximateCoordinate(input.longitude)
      : input.longitude;

    const imageUrl = file ? await this.uploads.storeImage(file) : null;
    const neighborhoodId = await this.resolveNeighborhood(latitude, longitude);
    const now = new Date();

    let post: PostRecord;
    try {
      post = await this.prisma.$transaction(async (tx) => {
        const created = await tx.post.create({
          data: {
            title: input.title,
            content: input.content || null,
            category: input.category,
            latitude,
            longitude,
            isApproximateLocation: approximate,
            imageUrl,
            authorId: author.id,
            neighborhoodId,
            expiresAt: expiryFor(input.category, now),
            ...(lostFound ? { lostFound: { create: lostFound } } : {}),
          },
          include: postInclude,
        });
        await tx.user.update({
          where: { id: author.id },
          data: { reputation: { increment: 5 } },
        });
        return created;
      });
    } catch (e) {
      await this.uploads.remove(imageUrl);
      throw e;
    }

    const dto = toPostDto(post);
    this.gateway.emitPublic('postCreated', dto);

    const alertPost = {
      id: post.id,
      authorId: post.authorId,
      title: post.title,
      category: post.category,
      latitude,
      longitude,
    };
    if (urgent) {
      // Urgent requests report back exactly who was reached, so the UI never overstates it.
      const alertSummary = await this.notifications
        .notifyNearby(alertPost)
        .catch((e) => {
          this.logger.error(
            `Urgent alert delivery failed: ${(e as Error).message}`,
          );
          return { notified: 0, pushDelivered: 0 };
        });
      return { ...dto, alertSummary };
    }
    void this.notifications
      .notifyNearby(alertPost)
      .catch((e) =>
        this.logger.warn(`Nearby alerts failed: ${(e as Error).message}`),
      );
    if (lostFound)
      void this.lostFound
        .notifyNewMatches(post.id)
        .catch((e) =>
          this.logger.warn(`Match notify failed: ${(e as Error).message}`),
        );
    return dto;
  }

  private lostFoundWindow(input: CreatePostDto) {
    const now = Date.now();
    const to = input.occurredTo ? new Date(input.occurredTo) : new Date(now);
    const from = input.occurredFrom
      ? new Date(input.occurredFrom)
      : new Date(to.getTime() - DAY);
    if (from > to) throw new BadRequestException('"From" must be before "to"');
    if (to.getTime() > now + HOUR)
      throw new BadRequestException('The time window cannot be in the future');
    if (to.getTime() - from.getTime() > 30 * DAY)
      throw new BadRequestException('The time window can be at most 30 days');
    if (from.getTime() < now - 365 * DAY)
      throw new BadRequestException('Reports must be about the last 12 months');
    return {
      direction: input.lostFoundDirection!,
      itemType: input.lostFoundItemType!,
      occurredFrom: from,
      occurredTo: to,
    };
  }

  /** Server-derived area label; client-supplied place names are ignored. */
  private async resolveNeighborhood(
    latitude: number,
    longitude: number,
  ): Promise<string | null> {
    const geo = await this.geocoding.reverse(latitude, longitude);
    if (geo) {
      const city = await this.prisma.city.upsert({
        where: { name: geo.city },
        update: {},
        create: {
          name: geo.city,
          country: geo.country || 'Unknown',
          latitude,
          longitude,
        },
      });
      const hood = await this.prisma.neighborhood.upsert({
        where: { name_cityId: { name: geo.neighborhood, cityId: city.id } },
        update: {},
        create: {
          name: geo.neighborhood,
          cityId: city.id,
          latitude,
          longitude,
        },
      });
      return hood.id;
    }
    // No geocoder: use the nearest known neighbourhood whose area contains the point.
    const box = boundingBox({ latitude, longitude }, 3);
    const nearby = await this.prisma.neighborhood.findMany({
      where: {
        latitude: { gte: box.minLat, lte: box.maxLat },
        longitude: { gte: box.minLng, lte: box.maxLng },
      },
      select: { id: true, latitude: true, longitude: true, radiusKm: true },
      take: 200,
    });
    let best: { id: string; d: number } | null = null;
    for (const n of nearby) {
      const d = distanceKm({ latitude, longitude }, n);
      if (d <= n.radiusKm * 1.5 && (!best || d < best.d))
        best = { id: n.id, d };
    }
    return best?.id ?? null;
  }

  // --- Read --------------------------------------------------------------------

  async getFeed(q: FeedQueryDto, viewer?: User): Promise<PostDto[]> {
    const { latitude: lat, longitude: lng, radius } = q;
    const box = boundingBox({ latitude: lat, longitude: lng }, radius);
    const hours = TIME_WINDOWS[q.since];
    const since = hours ? new Date(Date.now() - hours * HOUR) : null;
    const categories = q.category?.length ? q.category : null;
    const search = q.search ? `%${escapeLike(q.search)}%` : null;
    const offset = (q.page - 1) * q.limit;

    const rows = await this.prisma.$queryRaw<
      { id: string; distance: number }[]
    >`
      WITH candidates AS (
        SELECT p.id, p."createdAt",
          2 * 6371 * asin(least(1, sqrt(
            power(sin(radians(p.latitude - ${lat}) / 2), 2) +
            cos(radians(${lat})) * cos(radians(p.latitude)) * power(sin(radians(p.longitude - ${lng}) / 2), 2)
          ))) AS distance
        FROM "Post" p
        JOIN "User" u ON u.id = p."authorId" AND u."isBlocked" = false
        LEFT JOIN "LostFoundItem" lf ON lf."postId" = p.id
        WHERE p.latitude BETWEEN ${box.minLat} AND ${box.maxLat}
          AND p.longitude BETWEEN ${box.minLng} AND ${box.maxLng}
          AND p.status <> 'REMOVED'
          ${q.includeInactive ? Prisma.empty : Prisma.sql`AND p.status = 'ACTIVE' AND (p."expiresAt" IS NULL OR p."expiresAt" > now())`}
          ${categories ? Prisma.sql`AND p.category::text IN (${Prisma.join(categories)})` : Prisma.empty}
          ${since ? Prisma.sql`AND p."createdAt" >= ${since}` : Prisma.empty}
          ${search ? Prisma.sql`AND (p.title ILIKE ${search} OR p.content ILIKE ${search})` : Prisma.empty}
          ${q.lostFoundDirection ? Prisma.sql`AND lf.direction::text = ${q.lostFoundDirection}` : Prisma.empty}
      )
      SELECT id, distance FROM candidates
      WHERE distance <= ${radius}
      ORDER BY "createdAt" DESC, id
      LIMIT ${q.limit} OFFSET ${offset};
    `;
    if (!rows.length) return [];

    const ids = rows.map((r) => r.id);
    const posts = await this.prisma.post.findMany({
      where: { id: { in: ids } },
      include: postInclude,
    });
    const byId = new Map(posts.map((p) => [p.id, p]));
    const [confirmations, viewerStates] = await Promise.all([
      this.confirmationSummaries(ids),
      this.viewerStates(ids, viewer),
    ]);

    return rows
      .filter((r) => byId.has(r.id))
      .map((r) =>
        toPostDto(byId.get(r.id)!, {
          distanceKm: Number(r.distance),
          confirmations: confirmations.get(r.id),
          viewer: viewerStates?.get(r.id),
        }),
      );
  }

  async findByAuthor(
    authorId: string,
    page: number,
    limit: number,
    viewer?: User,
  ) {
    const own = viewer?.id === authorId || isModerator(viewer);
    const posts = await this.prisma.post.findMany({
      where: {
        authorId,
        status: own ? undefined : { not: PostStatus.REMOVED },
        author: own ? undefined : { isBlocked: false },
      },
      include: postInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const ids = posts.map((p) => p.id);
    const [confirmations, viewerStates] = await Promise.all([
      this.confirmationSummaries(ids),
      this.viewerStates(ids, viewer),
    ]);
    return posts.map((p) =>
      toPostDto(p, {
        confirmations: confirmations.get(p.id),
        viewer: viewerStates?.get(p.id),
      }),
    );
  }

  async findOne(id: string, viewer?: User): Promise<PostDto> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: postInclude,
    });
    if (!post)
      throw new NotFoundException('This post does not exist or was deleted');
    if (
      post.status === PostStatus.REMOVED &&
      post.authorId !== viewer?.id &&
      !isModerator(viewer)
    ) {
      throw new NotFoundException('This post was removed by moderators');
    }
    const [confirmations, viewerStates] = await Promise.all([
      this.confirmationSummaries([id]),
      this.viewerStates([id], viewer),
    ]);
    return toPostDto(post, {
      confirmations: confirmations.get(id),
      viewer: viewerStates?.get(id),
    });
  }

  private async confirmationSummaries(ids: string[]) {
    const map = new Map<
      string,
      { stillHappening: number; noLongerPresent: number }
    >();
    if (!ids.length) return map;
    const groups = await this.prisma.postConfirmation.groupBy({
      by: ['postId', 'state'],
      where: {
        postId: { in: ids },
        updatedAt: { gte: new Date(Date.now() - CONFIRMATION_WINDOW_MS) },
      },
      _count: { _all: true },
    });
    for (const g of groups) {
      const entry = map.get(g.postId) ?? {
        stillHappening: 0,
        noLongerPresent: 0,
      };
      if (g.state === ConfirmationState.STILL_HAPPENING)
        entry.stillHappening = g._count._all;
      else entry.noLongerPresent = g._count._all;
      map.set(g.postId, entry);
    }
    return map;
  }

  private async viewerStates(
    ids: string[],
    viewer?: User,
  ): Promise<Map<string, ViewerState> | undefined> {
    if (!viewer || !ids.length) return undefined;
    const [votes, saved, confirms, authors] = await Promise.all([
      this.prisma.postVote.findMany({
        where: { userId: viewer.id, postId: { in: ids } },
        select: { postId: true },
      }),
      this.prisma.savedPost.findMany({
        where: { userId: viewer.id, postId: { in: ids } },
        select: { postId: true },
      }),
      this.prisma.postConfirmation.findMany({
        where: { userId: viewer.id, postId: { in: ids } },
        select: { postId: true, state: true },
      }),
      this.prisma.post.findMany({
        where: { id: { in: ids } },
        select: { id: true, authorId: true },
      }),
    ]);
    const voted = new Set(votes.map((v) => v.postId));
    const savedSet = new Set(saved.map((s) => s.postId));
    const confirmBy = new Map(confirms.map((c) => [c.postId, c.state]));
    const authorBy = new Map(authors.map((a) => [a.id, a.authorId]));
    return new Map(
      ids.map((id) => [
        id,
        {
          isAuthor: authorBy.get(id) === viewer.id,
          hasVoted: voted.has(id),
          hasSaved: savedSet.has(id),
          confirmation: confirmBy.get(id) ?? null,
        },
      ]),
    );
  }

  private async loadVisible(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post || post.status === PostStatus.REMOVED)
      throw new NotFoundException('Post not found');
    return post;
  }

  // --- Interactions --------------------------------------------------------------

  /** Toggles the caller's like. Idempotent per user thanks to the unique (userId, postId). */
  async toggleVote(postId: string, user: User) {
    this.rateLimit.consume(`vote:${user.id}`, 60, MINUTE);
    const post = await this.loadVisible(postId);
    const existing = await this.prisma.postVote.findUnique({
      where: { userId_postId: { userId: user.id, postId } },
    });

    return this.prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.postVote.delete({ where: { id: existing.id } });
        const updated = await tx.post.update({
          where: { id: postId },
          data: { likes: { decrement: 1 } },
          select: { likes: true },
        });
        if (post.authorId !== user.id)
          await tx.user.update({
            where: { id: post.authorId },
            data: { reputation: { decrement: 1 } },
          });
        return { liked: false, likes: Math.max(0, updated.likes) };
      }
      await tx.postVote.create({
        data: { userId: user.id, postId, type: 'UP' },
      });
      const updated = await tx.post.update({
        where: { id: postId },
        data: { likes: { increment: 1 } },
        select: { likes: true },
      });
      if (post.authorId !== user.id)
        await tx.user.update({
          where: { id: post.authorId },
          data: { reputation: { increment: 1 } },
        });
      return { liked: true, likes: updated.likes };
    });
  }

  async voteStatus(postId: string, user: User) {
    const vote = await this.prisma.postVote.findUnique({
      where: { userId_postId: { userId: user.id, postId } },
    });
    return { hasVoted: !!vote, type: vote?.type ?? null };
  }

  /** "Still happening" / "no longer present" answer from someone other than the author. */
  async confirm(postId: string, user: User, state: ConfirmationState) {
    this.rateLimit.consume(`confirm:${user.id}`, 30, HOUR);
    const post = await this.loadVisible(postId);
    if (post.authorId === user.id)
      throw new BadRequestException('You cannot confirm your own report');
    if (effectiveStatus(post) !== PostStatus.ACTIVE)
      throw new BadRequestException('This report is no longer active');

    const existing = await this.prisma.postConfirmation.findUnique({
      where: { postId_userId: { postId, userId: user.id } },
    });
    if (
      existing &&
      existing.state !== state &&
      Date.now() - existing.updatedAt.getTime() < CONFIRMATION_COOLDOWN_MS
    ) {
      throw new HttpException(
        'You changed your answer recently. Try again in a little while.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const now = new Date();
    await this.prisma.postConfirmation.upsert({
      where: { postId_userId: { postId, userId: user.id } },
      update: { state },
      create: { postId, userId: user.id, state },
    });

    const summary = (await this.confirmationSummaries([postId])).get(
      postId,
    ) ?? { stillHappening: 0, noLongerPresent: 0 };
    const verificationStatus = verificationFor(
      post.verificationStatus,
      summary.stillHappening,
    );
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        verificationStatus,
        ...(state === ConfirmationState.STILL_HAPPENING
          ? { lastConfirmedAt: now }
          : {}),
      },
    });

    if (
      summary.noLongerPresent >= 3 &&
      summary.noLongerPresent > summary.stillHappening
    ) {
      await this.notifications.sendNotification(
        post.authorId,
        NotificationType.POST_UPDATE,
        'Is your report still current?',
        `Several people say "${post.title}" is no longer happening. You can mark it as resolved.`,
        postId,
        { dedupe: true },
      );
    }
    return { confirmations: summary, verificationStatus, yourAnswer: state };
  }

  /** Author or moderator marks a report resolved (lost & found: returned). */
  async resolve(postId: string, user: User, note?: string) {
    const post = await this.loadVisible(postId);
    const moderator = isModerator(user);
    if (post.authorId !== user.id && !moderator)
      throw new ForbiddenException(
        'Only the author or a moderator can resolve this post',
      );
    if (post.status === PostStatus.RESOLVED) return this.findOne(postId, user);

    await this.prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: postId },
        data: {
          status: PostStatus.RESOLVED,
          resolvedAt: new Date(),
          resolvedById: user.id,
          resolutionNote: note ?? null,
        },
      });
      await tx.lostFoundItem.updateMany({
        where: { postId, status: LostFoundStatus.OPEN },
        data: { status: LostFoundStatus.RETURNED, resolvedAt: new Date() },
      });
      await tx.contactRequest.updateMany({
        where: { postId, status: 'PENDING' },
        data: { status: 'DECLINED', respondedAt: new Date() },
      });
      if (moderator && post.authorId !== user.id)
        await this.audit.record(
          user.id,
          'RESOLVE_POST',
          'POST',
          postId,
          note,
          tx,
        );
    });
    const dto = await this.findOne(postId, user);
    this.gateway.emitPublic('postUpdated', { id: postId, status: dto.status });
    return dto;
  }

  /** Moderator removal: hidden from everyone but the author and moderators; audited. */
  async remove(postId: string, moderator: User, reason: string) {
    if (!isModerator(moderator)) throw new ForbiddenException();
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    await this.prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: postId },
        data: { status: PostStatus.REMOVED },
      });
      await tx.report.updateMany({
        where: { postId, status: 'PENDING' },
        data: {
          status: 'RESOLVED',
          reviewedById: moderator.id,
          reviewedAt: new Date(),
        },
      });
      await this.audit.record(
        moderator.id,
        'REMOVE_POST',
        'POST',
        postId,
        reason,
        tx,
      );
    });
    this.gateway.emitPublic('postUpdated', {
      id: postId,
      status: PostStatus.REMOVED,
    });
    await this.notifications.sendNotification(
      post.authorId,
      NotificationType.POST_UPDATE,
      'Your post was removed',
      `"${post.title}" was removed by a moderator: ${reason}`,
      postId,
    );
    return { id: postId, status: PostStatus.REMOVED };
  }

  /** Author deletes their own post (hard delete; image file removed too). */
  async deleteOwn(postId: string, user: User) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== user.id)
      throw new ForbiddenException('You can only delete your own posts');
    await this.prisma.post.delete({ where: { id: postId } });
    await this.uploads.remove(post.imageUrl);
    this.gateway.emitPublic('postUpdated', {
      id: postId,
      status: PostStatus.REMOVED,
    });
    return { deleted: true };
  }
}
