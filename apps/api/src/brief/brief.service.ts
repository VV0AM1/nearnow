import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category, Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { RateLimitService } from '../common/rate-limit.service';
import { boundingBox } from '../common/geo';
import {
  BriefCandidate,
  BriefCounts,
  BriefItem,
  briefSince,
  buildBrief,
} from './brief-builder';
import {
  BriefQueryDto,
  CreateSavedAreaDto,
  UpdateBriefPreferencesDto,
} from './brief.dto';

const HOUR = 60 * 60 * 1000;
export const MAX_SAVED_AREAS = 5;

export interface BriefDto {
  enabled: boolean;
  since: string;
  generatedAt: string;
  area: {
    id: string | null;
    label: string | null;
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  categories: Category[];
  counts: BriefCounts;
  items: BriefItem[];
  /** Active posts in the area right now — context for "no news", never a safety score. */
  activeInArea: number;
}

@Injectable()
export class BriefService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimit: RateLimitService,
  ) {}

  private async prefs(userId: string) {
    return (
      (await this.prisma.briefPreferences.findUnique({
        where: { userId },
      })) ?? {
        userId,
        enabled: true,
        categories: [] as Category[],
        lastSeenAt: null as Date | null,
      }
    );
  }

  async preferences(user: User) {
    const p = await this.prefs(user.id);
    return {
      enabled: p.enabled,
      categories: p.categories,
      lastSeenAt: p.lastSeenAt?.toISOString() ?? null,
    };
  }

  async updatePreferences(user: User, dto: UpdateBriefPreferencesDto) {
    await this.prisma.briefPreferences.upsert({
      where: { userId: user.id },
      update: { enabled: dto.enabled, categories: dto.categories },
      create: {
        userId: user.id,
        enabled: dto.enabled ?? true,
        categories: dto.categories ?? [],
      },
    });
    return this.preferences(user);
  }

  /** "Mark as read": the next brief starts from now. */
  async markSeen(user: User) {
    const now = new Date();
    await this.prisma.briefPreferences.upsert({
      where: { userId: user.id },
      update: { lastSeenAt: now },
      create: { userId: user.id, lastSeenAt: now },
    });
    return { lastSeenAt: now.toISOString() };
  }

  listAreas(user: User) {
    return this.prisma.savedArea.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        label: true,
        latitude: true,
        longitude: true,
        radiusKm: true,
      },
    });
  }

  async addArea(user: User, dto: CreateSavedAreaDto) {
    this.rateLimit.consume(`saved-area:${user.id}`, 30, HOUR);
    const count = await this.prisma.savedArea.count({
      where: { userId: user.id },
    });
    if (count >= MAX_SAVED_AREAS)
      throw new BadRequestException(
        `You can save up to ${MAX_SAVED_AREAS} areas. Remove one first.`,
      );
    return this.prisma.savedArea.create({
      data: {
        userId: user.id,
        label: dto.label,
        latitude: dto.latitude,
        longitude: dto.longitude,
        radiusKm: dto.radiusKm,
      },
      select: {
        id: true,
        label: true,
        latitude: true,
        longitude: true,
        radiusKm: true,
      },
    });
  }

  async removeArea(user: User, id: string) {
    const { count } = await this.prisma.savedArea.deleteMany({
      where: { id, userId: user.id },
    });
    if (!count) throw new NotFoundException('Saved area not found');
    return { deleted: true };
  }

  /**
   * What changed in one area since the user last read the brief. Uses only
   * lifecycle fields that already exist on posts; the same visibility rules as
   * the feed (no removed posts, no blocked authors) and never the user's own posts.
   */
  async brief(
    user: User,
    q: BriefQueryDto,
    now = new Date(),
  ): Promise<BriefDto> {
    this.rateLimit.consume(`brief:${user.id}`, 120, HOUR);
    const prefs = await this.prefs(user.id);

    let area: BriefDto['area'];
    if (q.areaId) {
      const saved = await this.prisma.savedArea.findFirst({
        where: { id: q.areaId, userId: user.id },
      });
      if (!saved) throw new NotFoundException('Saved area not found');
      area = {
        id: saved.id,
        label: saved.label,
        latitude: saved.latitude,
        longitude: saved.longitude,
        radiusKm: saved.radiusKm,
      };
    } else if (q.latitude !== undefined && q.longitude !== undefined) {
      area = {
        id: null,
        label: null,
        latitude: q.latitude,
        longitude: q.longitude,
        radiusKm: q.radius,
      };
    } else {
      throw new BadRequestException(
        'Choose an area: pass areaId, or latitude and longitude.',
      );
    }

    const since = briefSince(prefs.lastSeenAt, now);
    const base: Omit<BriefDto, 'counts' | 'items' | 'activeInArea'> = {
      enabled: prefs.enabled,
      since: since.toISOString(),
      generatedAt: now.toISOString(),
      area,
      categories: prefs.categories,
    };
    const empty = {
      new: 0,
      confirmed: 0,
      resolved: 0,
      expired: 0,
      unconfirmedNew: 0,
      official: 0,
    };
    if (!prefs.enabled)
      return { ...base, counts: empty, items: [], activeInArea: 0 };

    const { latitude: lat, longitude: lng, radiusKm: radius } = area;
    const box = boundingBox({ latitude: lat, longitude: lng }, radius);
    const categories = prefs.categories.length ? prefs.categories : null;
    const distance = Prisma.sql`2 * 6371 * asin(least(1, sqrt(
      power(sin(radians(p.latitude - ${lat}) / 2), 2) +
      cos(radians(${lat})) * cos(radians(p.latitude)) * power(sin(radians(p.longitude - ${lng}) / 2), 2)
    )))`;
    const inArea = Prisma.sql`
      FROM "Post" p
      JOIN "User" u ON u.id = p."authorId" AND u."isBlocked" = false
      WHERE p.latitude BETWEEN ${box.minLat} AND ${box.maxLat}
        AND p.longitude BETWEEN ${box.minLng} AND ${box.maxLng}
        AND p.status <> 'REMOVED'
        ${categories ? Prisma.sql`AND p.category::text IN (${Prisma.join(categories)})` : Prisma.empty}`;
    // Changes leave out the reader's own posts; the area count includes them.
    const scope = Prisma.sql`${inArea} AND p."authorId" <> ${user.id}`;

    const [rows, active] = await Promise.all([
      this.prisma.$queryRaw<
        (Omit<BriefCandidate, 'distanceKm'> & { distance: number })[]
      >`
        SELECT * FROM (
          SELECT p.id, p.title, p.category, p.status, p."verificationStatus", p."sourceName",
            p.latitude, p.longitude, p."isApproximateLocation", p."createdAt", p."expiresAt",
            p."lastConfirmedAt", p."resolvedAt", ${distance} AS distance
          ${scope}
            AND (p."createdAt" > ${since} OR p."resolvedAt" > ${since}
              OR p."lastConfirmedAt" > ${since}
              OR (p."expiresAt" > ${since} AND p."expiresAt" <= ${now}))
        ) c
        WHERE distance <= ${radius}
        ORDER BY GREATEST(c."createdAt", COALESCE(c."resolvedAt", c."createdAt"), COALESCE(c."lastConfirmedAt", c."createdAt")) DESC
        LIMIT 300`,
      this.prisma.$queryRaw<{ n: bigint }[]>`
        SELECT count(*)::bigint AS n FROM (
          SELECT ${distance} AS distance
          ${inArea}
            AND p.status = 'ACTIVE' AND (p."expiresAt" IS NULL OR p."expiresAt" > ${now})
        ) c WHERE distance <= ${radius}`,
    ]);

    const candidates: BriefCandidate[] = rows.map((r) => ({
      ...r,
      distanceKm: Number(r.distance),
    }));
    const { items, counts } = buildBrief(candidates, since, now);
    return { ...base, counts, items, activeInArea: Number(active[0]?.n ?? 0) };
  }
}
