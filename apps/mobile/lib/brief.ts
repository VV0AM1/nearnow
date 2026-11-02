import type { Category } from './types';

/** Mirrors GET /brief (apps/api/src/brief). */
export type BriefChange = 'NEW' | 'CONFIRMED' | 'RESOLVED' | 'EXPIRED';
export type BriefProvenance = 'OFFICIAL' | 'COMMUNITY_CONFIRMED' | 'UNCONFIRMED';

export interface BriefItem {
  postId: string;
  title: string;
  category: Category;
  change: BriefChange;
  provenance: BriefProvenance;
  sourceName: string | null;
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
  unconfirmedNew: number;
  official: number;
}

export interface Brief {
  enabled: boolean;
  since: string;
  generatedAt: string;
  area: { id: string | null; label: string | null; latitude: number; longitude: number; radiusKm: number };
  categories: Category[];
  counts: BriefCounts;
  items: BriefItem[];
  activeInArea: number;
}

export interface SavedArea {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export interface BriefLine {
  key: string;
  params?: Record<string, string | number>;
  tone: 'neutral' | 'warning';
}

/**
 * Deterministic summary sentences (i18n keys) from the server counts. When nothing
 * changed it says exactly that — and, with little activity in the area, that the
 * absence of reports is not evidence that nothing is happening.
 */
export function briefLines(b: Pick<Brief, 'counts' | 'activeInArea'>): BriefLine[] {
  const c = b.counts;
  const total = c.new + c.confirmed + c.resolved + c.expired;
  if (total === 0) {
    return [
      { key: 'brief.noneFound', tone: 'neutral' },
      { key: b.activeInArea === 0 ? 'brief.coverageLow' : 'brief.coverageNote', tone: 'neutral' },
    ];
  }
  const lines: BriefLine[] = [];
  if (c.new) lines.push({ key: 'brief.lineNew', params: { n: c.new }, tone: 'neutral' });
  if (c.resolved) lines.push({ key: 'brief.lineResolved', params: { n: c.resolved }, tone: 'neutral' });
  if (c.confirmed) lines.push({ key: 'brief.lineConfirmed', params: { n: c.confirmed }, tone: 'neutral' });
  if (c.expired) lines.push({ key: 'brief.lineExpired', params: { n: c.expired }, tone: 'neutral' });
  if (c.unconfirmedNew) lines.push({ key: 'brief.lineUnconfirmed', params: { n: c.unconfirmedNew }, tone: 'warning' });
  return lines;
}

/** Brief radius for the area the user follows: the API accepts 0.5–10 km. */
export function briefRadius(km: number): number {
  return Math.min(10, Math.max(0.5, km));
}
