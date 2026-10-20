import { Category, PostStatus, VerificationStatus } from '@prisma/client';

const H = 60 * 60 * 1000;
const D = 24 * H;

/**
 * How long a report stays current, and after how long without a fresh
 * confirmation it is shown as "may be outdated". Urgent categories age fastest.
 */
export const CATEGORY_LIFETIME: Record<
  Category,
  { expiresAfterMs: number; staleAfterMs: number | null }
> = {
  DANGER: { expiresAfterMs: 2 * H, staleAfterMs: 30 * 60 * 1000 },
  CRIME: { expiresAfterMs: 48 * H, staleAfterMs: 12 * H },
  SAFETY: { expiresAfterMs: 48 * H, staleAfterMs: 12 * H },
  GENERAL: { expiresAfterMs: 7 * D, staleAfterMs: 3 * D },
  EVENT: { expiresAfterMs: 14 * D, staleAfterMs: null },
  LOST_FOUND: { expiresAfterMs: 30 * D, staleAfterMs: null },
  RECOMMENDATION: { expiresAfterMs: 90 * D, staleAfterMs: null },
};

/** Distinct non-author "still happening" answers needed before a report counts as community-confirmed. */
export const COMMUNITY_CONFIRMATION_THRESHOLD = 2;
/** Only confirmations newer than this count towards the label. */
export const CONFIRMATION_WINDOW_MS = 24 * H;
/** A user may change their answer on a post at most this often. */
export const CONFIRMATION_COOLDOWN_MS = 30 * 60 * 1000;

export function expiryFor(category: Category, from: Date): Date {
  return new Date(from.getTime() + CATEGORY_LIFETIME[category].expiresAfterMs);
}

export interface LifecycleInput {
  category: Category;
  status: PostStatus;
  createdAt: Date;
  expiresAt: Date | null;
  lastConfirmedAt: Date | null;
}

/** Effective status at `now`: an ACTIVE post past its expiry is reported as EXPIRED. */
export function effectiveStatus(
  post: LifecycleInput,
  now = new Date(),
): PostStatus {
  if (
    post.status === PostStatus.ACTIVE &&
    post.expiresAt &&
    post.expiresAt.getTime() <= now.getTime()
  ) {
    return PostStatus.EXPIRED;
  }
  return post.status;
}

/** True when an active report has had no recent confirmation and may no longer be accurate. */
export function isStale(post: LifecycleInput, now = new Date()): boolean {
  if (effectiveStatus(post, now) !== PostStatus.ACTIVE) return false;
  const staleAfter = CATEGORY_LIFETIME[post.category].staleAfterMs;
  if (staleAfter === null) return false;
  const lastSignal = Math.max(
    post.createdAt.getTime(),
    post.lastConfirmedAt?.getTime() ?? 0,
  );
  return now.getTime() - lastSignal > staleAfter;
}

export interface ConfirmationSummary {
  stillHappening: number;
  noLongerPresent: number;
}

/**
 * Community confirmation never upgrades an OFFICIAL_SOURCE label and needs several
 * independent people — a single confirmation is never treated as proof.
 */
export function verificationFor(
  current: VerificationStatus,
  recentStillHappening: number,
): VerificationStatus {
  if (current === VerificationStatus.OFFICIAL_SOURCE) return current;
  return recentStillHappening >= COMMUNITY_CONFIRMATION_THRESHOLD
    ? VerificationStatus.COMMUNITY_CONFIRMED
    : VerificationStatus.UNVERIFIED;
}
