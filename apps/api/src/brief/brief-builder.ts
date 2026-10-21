import { Category, PostStatus, VerificationStatus } from '@prisma/client';
import { effectiveStatus } from '../posts/post-lifecycle';

/** What changed about a post since the user last read the brief. One change per post. */
export type BriefChange = 'RESOLVED' | 'EXPIRED' | 'NEW' | 'CONFIRMED';

/** Where the information comes from — shown on every line, never upgraded. */
export type BriefProvenance =
  | 'OFFICIAL'
  | 'COMMUNITY_CONFIRMED'
  | 'UNCONFIRMED';

export interface BriefCandidate {
  id: string;
  title: string;
  category: Category;
  status: PostStatus;
  verificationStatus: VerificationStatus;
  sourceName: string | null;
  latitude: number;
  longitude: number;
  isApproximateLocation: boolean;
  createdAt: Date;
  expiresAt: Date | null;
  lastConfirmedAt: Date | null;
  resolvedAt: Date | null;
  distanceKm: number;
}

export interface BriefItem {
  postId: string;
  title: string;
  category: Category;
  change: BriefChange;
  provenance: BriefProvenance;
  sourceName: string | null;
  /** When the change happened (ISO). */
  at: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
  isApproximateLocation: boolean;
}

export interface BriefCounts {
  new: number;
  confirmed: number;
  resolved: number;
  expired: number;
  /** New items that nobody has confirmed yet — "view before relying on them". */
  unconfirmedNew: number;
  official: number;
}

export function provenanceOf(v: VerificationStatus): BriefProvenance {
  if (v === VerificationStatus.OFFICIAL_SOURCE) return 'OFFICIAL';
  if (v === VerificationStatus.COMMUNITY_CONFIRMED)
    return 'COMMUNITY_CONFIRMED';
  return 'UNCONFIRMED';
}

/**
 * The single most relevant change of a post in (since, now]. Precedence: a
 * resolution or expiry ends the story; otherwise a new post; otherwise a fresh
 * "still happening" confirmation on an older post. Removed posts never appear.
 */
export function classifyChange(
  p: BriefCandidate,
  since: Date,
  now: Date,
): { change: BriefChange; at: Date } | null {
  if (p.status === PostStatus.REMOVED) return null;
  const inWindow = (d: Date | null): d is Date =>
    !!d && d.getTime() > since.getTime() && d.getTime() <= now.getTime();

  if (p.status === PostStatus.RESOLVED && inWindow(p.resolvedAt))
    return { change: 'RESOLVED', at: p.resolvedAt };
  if (
    effectiveStatus(p, now) === PostStatus.EXPIRED &&
    !p.resolvedAt &&
    inWindow(p.expiresAt)
  )
    return { change: 'EXPIRED', at: p.expiresAt };
  if (effectiveStatus(p, now) !== PostStatus.ACTIVE) return null;
  if (inWindow(p.createdAt)) return { change: 'NEW', at: p.createdAt };
  if (inWindow(p.lastConfirmedAt))
    return { change: 'CONFIRMED', at: p.lastConfirmedAt };
  return null;
}

/** Deterministic brief: classify, count, and order newest first. No inference, no AI. */
export function buildBrief(
  candidates: BriefCandidate[],
  since: Date,
  now: Date,
  limit = 20,
): { items: BriefItem[]; counts: BriefCounts } {
  const counts: BriefCounts = {
    new: 0,
    confirmed: 0,
    resolved: 0,
    expired: 0,
    unconfirmedNew: 0,
    official: 0,
  };
  const items: BriefItem[] = [];
  const seen = new Set<string>();
  for (const p of candidates) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    const c = classifyChange(p, since, now);
    if (!c) continue;
    const provenance = provenanceOf(p.verificationStatus);
    if (c.change === 'NEW') {
      counts.new++;
      if (provenance === 'UNCONFIRMED') counts.unconfirmedNew++;
    } else if (c.change === 'CONFIRMED') counts.confirmed++;
    else if (c.change === 'RESOLVED') counts.resolved++;
    else counts.expired++;
    if (provenance === 'OFFICIAL') counts.official++;
    items.push({
      postId: p.id,
      title: p.title,
      category: p.category,
      change: c.change,
      provenance,
      sourceName: provenance === 'OFFICIAL' ? p.sourceName : null,
      at: c.at.toISOString(),
      distanceKm: Math.round(p.distanceKm * 10) / 10,
      latitude: p.latitude,
      longitude: p.longitude,
      isApproximateLocation: p.isApproximateLocation,
    });
  }
  items.sort(
    (a, b) => b.at.localeCompare(a.at) || a.postId.localeCompare(b.postId),
  );
  return { items: items.slice(0, limit), counts };
}

/** Window start: last read time, at most 7 days back; first visit looks back 24 hours. */
export function briefSince(lastSeenAt: Date | null, now: Date): Date {
  const week = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const fallback = now.getTime() - 24 * 60 * 60 * 1000;
  return new Date(Math.max(lastSeenAt?.getTime() ?? fallback, week));
}
