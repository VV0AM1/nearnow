import { Category } from '@prisma/client';
import { distanceKm } from '../common/geo';

/** Urgent help requests only reach people this close, whatever their chosen radius. */
export const URGENT_MAX_RADIUS_KM = 3;
/** Upper bound of nearby alerts one person receives per hour (urgent ones included). */
export const MAX_ALERTS_PER_HOUR = 6;

export interface AlertSettings {
  userId: string;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number;
  categories: Category[];
  paused: boolean;
  pushEnabled: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  timezone: string | null;
}

export interface AlertPost {
  authorId: string;
  category: Category;
  latitude: number;
  longitude: number;
}

export type AlertDecision =
  | {
      notify: false;
      reason:
        | 'AUTHOR'
        | 'PAUSED'
        | 'NO_AREA'
        | 'CATEGORY_NOT_CHOSEN'
        | 'OUT_OF_RANGE';
    }
  | { notify: true; push: boolean; distanceKm: number };

/** Minutes since local midnight in `timezone` (UTC when unknown/invalid). */
export function localMinutes(now: Date, timezone: string | null): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone || 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    return h * 60 + m;
  } catch {
    return now.getUTCHours() * 60 + now.getUTCMinutes();
  }
}

export function inQuietHours(
  s: Pick<AlertSettings, 'quietHoursStart' | 'quietHoursEnd' | 'timezone'>,
  now: Date,
): boolean {
  if (
    s.quietHoursStart == null ||
    s.quietHoursEnd == null ||
    s.quietHoursStart === s.quietHoursEnd
  )
    return false;
  const t = localMinutes(now, s.timezone);
  return s.quietHoursStart < s.quietHoursEnd
    ? t >= s.quietHoursStart && t < s.quietHoursEnd
    : t >= s.quietHoursStart || t < s.quietHoursEnd; // window wraps midnight
}

/**
 * Decides whether one person should hear about a new post. Every category —
 * including urgent help requests — requires an explicit opt-in, a chosen alert
 * area and proximity. Nothing is ever broadcast to everyone.
 */
export function decideAlert(
  s: AlertSettings,
  post: AlertPost,
  now = new Date(),
): AlertDecision {
  if (s.userId === post.authorId) return { notify: false, reason: 'AUTHOR' };
  if (s.paused) return { notify: false, reason: 'PAUSED' };
  if (s.latitude == null || s.longitude == null)
    return { notify: false, reason: 'NO_AREA' };
  if (!s.categories.includes(post.category))
    return { notify: false, reason: 'CATEGORY_NOT_CHOSEN' };

  const d = distanceKm({ latitude: s.latitude, longitude: s.longitude }, post);
  const limit =
    post.category === Category.DANGER
      ? Math.min(s.radiusKm, URGENT_MAX_RADIUS_KM)
      : s.radiusKm;
  if (d > limit) return { notify: false, reason: 'OUT_OF_RANGE' };

  return {
    notify: true,
    push: s.pushEnabled && !inQuietHours(s, now),
    distanceKm: d,
  };
}
