import { Category, PostStatus, VerificationStatus } from '@prisma/client';
import {
  BriefCandidate,
  briefSince,
  buildBrief,
  classifyChange,
} from './brief-builder';

const H = 60 * 60 * 1000;
const now = new Date('2026-10-21T12:00:00Z');
const since = new Date(now.getTime() - 6 * H);

const post = (over: Partial<BriefCandidate> = {}): BriefCandidate => ({
  id: over.id ?? 'p1',
  title: 'Street closed',
  category: Category.GENERAL,
  status: PostStatus.ACTIVE,
  verificationStatus: VerificationStatus.UNVERIFIED,
  sourceName: null,
  latitude: 41.39,
  longitude: 2.17,
  isApproximateLocation: false,
  createdAt: new Date(now.getTime() - 2 * H),
  expiresAt: new Date(now.getTime() + 48 * H),
  lastConfirmedAt: null,
  resolvedAt: null,
  distanceKm: 0.43,
  ...over,
});

describe('classifyChange', () => {
  it('marks a post created in the window as NEW', () => {
    expect(classifyChange(post(), since, now)?.change).toBe('NEW');
  });

  it('prefers RESOLVED over NEW for a post created and resolved in the window', () => {
    const p = post({
      status: PostStatus.RESOLVED,
      resolvedAt: new Date(now.getTime() - H),
    });
    expect(classifyChange(p, since, now)).toEqual({
      change: 'RESOLVED',
      at: p.resolvedAt,
    });
  });

  it('reports EXPIRED when expiry passed inside the window and it was not resolved', () => {
    const p = post({
      createdAt: new Date(now.getTime() - 50 * H),
      expiresAt: new Date(now.getTime() - H),
    });
    expect(classifyChange(p, since, now)?.change).toBe('EXPIRED');
  });

  it('reports CONFIRMED for an older active post confirmed in the window', () => {
    const p = post({
      createdAt: new Date(now.getTime() - 30 * H),
      lastConfirmedAt: new Date(now.getTime() - 3 * H),
    });
    expect(classifyChange(p, since, now)?.change).toBe('CONFIRMED');
  });

  it('ignores removed posts, old unchanged posts, and changes before the window', () => {
    expect(
      classifyChange(post({ status: PostStatus.REMOVED }), since, now),
    ).toBeNull();
    expect(
      classifyChange(
        post({ createdAt: new Date(now.getTime() - 30 * H) }),
        since,
        now,
      ),
    ).toBeNull();
    expect(
      classifyChange(
        post({
          status: PostStatus.RESOLVED,
          createdAt: new Date(now.getTime() - 30 * H),
          resolvedAt: new Date(now.getTime() - 8 * H),
        }),
        since,
        now,
      ),
    ).toBeNull();
  });
});

describe('buildBrief', () => {
  it('counts each change once, flags unconfirmed and official items, and sorts newest first', () => {
    const { items, counts } = buildBrief(
      [
        post({ id: 'a', createdAt: new Date(now.getTime() - 4 * H) }),
        post({
          id: 'b',
          verificationStatus: VerificationStatus.OFFICIAL_SOURCE,
          sourceName: 'City council',
        }),
        post({
          id: 'c',
          status: PostStatus.RESOLVED,
          createdAt: new Date(now.getTime() - 40 * H),
          resolvedAt: new Date(now.getTime() - 30 * 60 * 1000),
        }),
        post({ id: 'a' }), // duplicate row is ignored
      ],
      since,
      now,
    );
    expect(items.map((i) => [i.postId, i.change, i.provenance])).toEqual([
      ['c', 'RESOLVED', 'UNCONFIRMED'],
      ['b', 'NEW', 'OFFICIAL'],
      ['a', 'NEW', 'UNCONFIRMED'],
    ]);
    expect(counts).toEqual({
      new: 2,
      confirmed: 0,
      resolved: 1,
      expired: 0,
      unconfirmedNew: 1,
      official: 1,
    });
    expect(items[1].sourceName).toBe('City council');
    expect(items[0].distanceKm).toBe(0.4);
  });

  it('returns nothing (not "safe") when there are no changes', () => {
    expect(buildBrief([], since, now)).toEqual({
      items: [],
      counts: {
        new: 0,
        confirmed: 0,
        resolved: 0,
        expired: 0,
        unconfirmedNew: 0,
        official: 0,
      },
    });
  });
});

describe('briefSince', () => {
  it('looks back 24 hours on first use and never more than 7 days', () => {
    expect(briefSince(null, now).getTime()).toBe(now.getTime() - 24 * H);
    expect(
      briefSince(new Date(now.getTime() - 30 * 24 * H), now).getTime(),
    ).toBe(now.getTime() - 7 * 24 * H);
    const recent = new Date(now.getTime() - 2 * H);
    expect(briefSince(recent, now)).toEqual(recent);
  });
});
