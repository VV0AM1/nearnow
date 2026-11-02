import { Injectable } from '@nestjs/common';
import { Category, PostStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { boundingBox, distanceKm } from '../common/geo';

export const ACTIVITY_DISCLAIMER =
  'These numbers count posts written by NearNow users. They are not official crime statistics, ' +
  'depend on how many people use the app in each area, and do not tell you whether a place is safe. ' +
  'In an emergency call 112.';

@Injectable()
export class NeighborhoodsService {
  constructor(private readonly prisma: PrismaService) {}

  listCities() {
    return this.prisma.city.findMany({
      orderBy: { name: 'asc' },
      take: 200,
      select: {
        id: true,
        name: true,
        country: true,
        latitude: true,
        longitude: true,
      },
    });
  }

  /**
   * Transparent summary of recent community posts around a point, grouped by area.
   * Replaces the former "safest / most dangerous" ranking, which was derived from raw
   * post counts and could not support any claim about safety.
   */
  async activity(
    latitude: number,
    longitude: number,
    radiusKm: number,
    days: number,
  ) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const box = boundingBox({ latitude, longitude }, radiusKm);
    const posts = await this.prisma.post.findMany({
      where: {
        createdAt: { gte: since },
        status: { not: PostStatus.REMOVED },
        author: { isBlocked: false },
        latitude: { gte: box.minLat, lte: box.maxLat },
        longitude: { gte: box.minLng, lte: box.maxLng },
      },
      select: {
        latitude: true,
        longitude: true,
        category: true,
        createdAt: true,
        status: true,
        neighborhood: {
          select: { id: true, name: true, city: { select: { name: true } } },
        },
      },
      take: 5000,
    });

    type Area = {
      id: string | null;
      name: string;
      city: string | null;
      reports: number;
      resolved: number;
      byCategory: Partial<Record<Category, number>>;
      lastReportAt: Date | null;
    };
    const areas = new Map<string, Area>();
    let total = 0;
    for (const p of posts) {
      if (distanceKm({ latitude, longitude }, p) > radiusKm) continue;
      total += 1;
      const key = p.neighborhood?.id ?? 'unassigned';
      const area =
        areas.get(key) ??
        ({
          id: p.neighborhood?.id ?? null,
          name: p.neighborhood?.name ?? 'Other nearby places',
          city: p.neighborhood?.city?.name ?? null,
          reports: 0,
          resolved: 0,
          byCategory: {},
          lastReportAt: null,
        } as Area);
      area.reports += 1;
      if (p.status === PostStatus.RESOLVED) area.resolved += 1;
      area.byCategory[p.category] = (area.byCategory[p.category] ?? 0) + 1;
      if (!area.lastReportAt || p.createdAt > area.lastReportAt)
        area.lastReportAt = p.createdAt;
      areas.set(key, area);
    }

    return {
      generatedAt: new Date(),
      windowDays: days,
      radiusKm,
      totalReports: total,
      areas: [...areas.values()].sort(
        (a, b) => b.reports - a.reports || a.name.localeCompare(b.name),
      ),
      source: 'COMMUNITY_REPORTS',
      method: `Posts created in the last ${days} days within ${radiusKm} km, grouped by the area assigned when they were posted. Removed posts and posts by suspended accounts are excluded.`,
      disclaimer: ACTIVITY_DISCLAIMER,
    };
  }
}
