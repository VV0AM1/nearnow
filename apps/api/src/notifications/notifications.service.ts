import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Category, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { AppGateway } from '../app.gateway';
import { boundingBox } from '../common/geo';
import { HOUR, RateLimitService } from '../common/rate-limit.service';
import { decideAlert, MAX_ALERTS_PER_HOUR } from './alert-policy';
import { PushService } from './push.service';
import { UpdateNotificationSettingsDto } from './dto/notification.dto';

const notificationSelect = {
  id: true,
  type: true,
  title: true,
  message: true,
  read: true,
  createdAt: true,
  postId: true,
  post: { select: { id: true, title: true, category: true, status: true } },
} satisfies Prisma.NotificationSelect;

type NotificationRecord = Prisma.NotificationGetPayload<{
  select: typeof notificationSelect;
}>;

/** The single notification contract shared by REST responses and socket events. */
export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string | null;
  message: string;
  read: boolean;
  createdAt: Date;
  postId: string | null;
  post: {
    id: string;
    title: string;
    category: Category;
    status: string;
  } | null;
}

export const toNotificationDto = (n: NotificationRecord): NotificationDto => ({
  id: n.id,
  type: n.type,
  title: n.title,
  message: n.message,
  read: n.read,
  createdAt: n.createdAt,
  postId: n.postId,
  post: n.post,
});

const CATEGORY_TITLE: Record<Category, string> = {
  DANGER: 'Urgent help request nearby',
  CRIME: 'Incident reported nearby',
  SAFETY: 'Safety notice nearby',
  GENERAL: 'New local update nearby',
  EVENT: 'Community event nearby',
  LOST_FOUND: 'Lost & found report nearby',
  RECOMMENDATION: 'New local recommendation',
};

export interface NearbyAlertPost {
  id: string;
  authorId: string;
  title: string;
  category: Category;
  latitude: number;
  longitude: number;
}

export interface AlertSummary {
  /** People who received an in-app notification. */
  notified: number;
  /** Devices the push provider accepted the message for (0 when push is not configured). */
  pushDelivered: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: AppGateway,
    private readonly push: PushService,
    private readonly rateLimit: RateLimitService,
  ) {}

  /** Notifies opted-in people whose chosen alert area covers the post. */
  async notifyNearby(post: NearbyAlertPost): Promise<AlertSummary> {
    const box = boundingBox(post, 25); // 25 km is the largest selectable alert radius
    const candidates = await this.prisma.notificationSettings.findMany({
      where: {
        paused: false,
        categories: { has: post.category },
        latitude: { not: null, gte: box.minLat, lte: box.maxLat },
        longitude: { not: null, gte: box.minLng, lte: box.maxLng },
        user: { isBlocked: false, deletedAt: null },
      },
      take: 5000,
    });

    const now = new Date();
    const inApp: string[] = [];
    const pushTo: string[] = [];
    for (const s of candidates) {
      const decision = decideAlert(s, post, now);
      if (!decision.notify) continue;
      if (
        !this.rateLimit.tryConsume(
          `alerts:${s.userId}`,
          MAX_ALERTS_PER_HOUR,
          HOUR,
        )
      )
        continue;
      inApp.push(s.userId);
      if (decision.push) pushTo.push(s.userId);
    }
    if (!inApp.length) return { notified: 0, pushDelivered: 0 };

    const already = await this.prisma.notification.findMany({
      where: {
        postId: post.id,
        type: NotificationType.POST_NEARBY,
        userId: { in: inApp },
      },
      select: { userId: true },
    });
    const skip = new Set(already.map((n) => n.userId));
    const recipients = inApp.filter((id) => !skip.has(id));

    const title = CATEGORY_TITLE[post.category];
    await this.prisma.notification.createMany({
      data: recipients.map((userId) => ({
        userId,
        type: NotificationType.POST_NEARBY,
        title,
        message: post.title,
        postId: post.id,
      })),
    });
    const created = await this.prisma.notification.findMany({
      where: {
        postId: post.id,
        type: NotificationType.POST_NEARBY,
        userId: { in: recipients },
      },
      select: { ...notificationSelect, userId: true },
    });
    for (const n of created)
      this.gateway.emitToUser(n.userId, 'notification', toNotificationDto(n));

    const pushDelivered = await this.push.sendToUsers(
      pushTo.filter((id) => !skip.has(id)),
      { title, body: post.title, data: { postId: post.id } },
    );
    return { notified: recipients.length, pushDelivered };
  }

  /** Sends one notification to one user, skipping exact duplicates for the same post. */
  async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    postId?: string,
    opts: { dedupe?: boolean; push?: boolean } = {},
  ): Promise<NotificationDto | null> {
    if (opts.dedupe && postId) {
      const exists = await this.prisma.notification.findFirst({
        where: { userId, postId, type },
        select: { id: true },
      });
      if (exists) return null;
    }
    const n = await this.prisma.notification.create({
      data: { userId, type, title, message, postId },
      select: notificationSelect,
    });
    const dto = toNotificationDto(n);
    this.gateway.emitToUser(userId, 'notification', dto);
    if (opts.push) {
      const settings = await this.prisma.notificationSettings.findUnique({
        where: { userId },
      });
      if (settings?.pushEnabled && !settings.paused) {
        await this.push.sendToUsers([userId], {
          title,
          body: message,
          data: postId ? { postId } : {},
        });
      }
    }
    return dto;
  }

  async list(userId: string, page: number, limit: number) {
    const [items, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: notificationSelect,
      }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ]);
    return {
      items: items.map(toNotificationDto),
      unreadCount: unread,
      page,
      limit,
      hasMore: items.length === limit,
    };
  }

  unreadCount(userId: string) {
    return this.prisma.notification
      .count({ where: { userId, read: false } })
      .then((count) => ({ count }));
  }

  /** Marks one of the caller's own notifications as read; 404 for anyone else's. */
  async markAsRead(userId: string, id: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
    if (!count) throw new NotFoundException('Notification not found');
    return { id, read: true };
  }

  async markAllAsRead(userId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { updated: count };
  }

  async getSettings(userId: string) {
    const s = await this.prisma.notificationSettings.findUnique({
      where: { userId },
    });
    return this.toSettingsDto(s);
  }

  async updateSettings(userId: string, input: UpdateNotificationSettingsDto) {
    const hasLat = input.latitude !== undefined;
    const hasLng = input.longitude !== undefined;
    if (
      hasLat !== hasLng ||
      (hasLat && (input.latitude === null) !== (input.longitude === null))
    ) {
      throw new BadRequestException(
        'Send latitude and longitude together (or both null to clear the alert area)',
      );
    }
    if (input.timezone) {
      try {
        new Intl.DateTimeFormat('en', { timeZone: input.timezone });
      } catch {
        throw new BadRequestException('Unknown timezone');
      }
    }
    const qs = input.quietHoursStart;
    const qe = input.quietHoursEnd;
    if (
      (qs !== undefined || qe !== undefined) &&
      (qs == null) !== (qe == null)
    ) {
      throw new BadRequestException(
        'Set both quiet-hours start and end, or clear both',
      );
    }

    const data: Prisma.NotificationSettingsUncheckedUpdateInput = {};
    if (input.radiusKm !== undefined) data.radiusKm = input.radiusKm;
    if (hasLat) {
      data.latitude = input.latitude;
      data.longitude = input.longitude;
      if (input.latitude === null) data.areaLabel = null;
    }
    if (input.areaLabel !== undefined) data.areaLabel = input.areaLabel;
    if (input.categories !== undefined) data.categories = input.categories;
    if (input.pushEnabled !== undefined) {
      data.pushEnabled = input.pushEnabled;
      data.pushAlerts = input.pushEnabled;
    }
    if (input.paused !== undefined) data.paused = input.paused;
    if (input.quietHoursStart !== undefined)
      data.quietHoursStart = input.quietHoursStart;
    if (input.quietHoursEnd !== undefined)
      data.quietHoursEnd = input.quietHoursEnd;
    if (input.timezone !== undefined) data.timezone = input.timezone;

    const s = await this.prisma.notificationSettings.upsert({
      where: { userId },
      update: data,
      create: {
        ...(data as Prisma.NotificationSettingsUncheckedCreateInput),
        userId,
      },
    });
    return this.toSettingsDto(s);
  }

  private toSettingsDto(
    s: Prisma.NotificationSettingsGetPayload<object> | null,
  ) {
    return {
      radiusKm: s?.radiusKm ?? 2,
      latitude: s?.latitude ?? null,
      longitude: s?.longitude ?? null,
      areaLabel: s?.areaLabel ?? null,
      hasAlertArea: s?.latitude != null && s?.longitude != null,
      categories: s?.categories ?? [],
      pushEnabled: s?.pushEnabled ?? false,
      paused: s?.paused ?? false,
      quietHoursStart: s?.quietHoursStart ?? null,
      quietHoursEnd: s?.quietHoursEnd ?? null,
      timezone: s?.timezone ?? null,
      /** Whether this server can deliver OS push notifications at all. */
      pushAvailable: this.push.enabled,
    };
  }
}
