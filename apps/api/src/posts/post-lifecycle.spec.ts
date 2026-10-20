import { Category, PostStatus, VerificationStatus } from '@prisma/client';
import {
  effectiveStatus,
  expiryFor,
  isStale,
  verificationFor,
  COMMUNITY_CONFIRMATION_THRESHOLD,
} from './post-lifecycle';

const H = 3600_000;
const base = new Date('2026-10-19T12:00:00Z');
const post = (over: Partial<Parameters<typeof effectiveStatus>[0]> = {}) => ({
  category: Category.CRIME,
  status: PostStatus.ACTIVE,
  createdAt: base,
  expiresAt: expiryFor(Category.CRIME, base),
  lastConfirmedAt: null,
  ...over,
});

describe('post lifecycle', () => {
  it('urgent requests expire after 2 hours', () => {
    expect(expiryFor(Category.DANGER, base).getTime() - base.getTime()).toBe(
      2 * H,
    );
  });

  it('reports EXPIRED once past expiry, without a background job', () => {
    expect(effectiveStatus(post(), new Date(base.getTime() + 47 * H))).toBe(
      PostStatus.ACTIVE,
    );
    expect(effectiveStatus(post(), new Date(base.getTime() + 49 * H))).toBe(
      PostStatus.EXPIRED,
    );
  });

  it('never turns RESOLVED or REMOVED back into another state', () => {
    const later = new Date(base.getTime() + 100 * H);
    expect(effectiveStatus(post({ status: PostStatus.RESOLVED }), later)).toBe(
      PostStatus.RESOLVED,
    );
    expect(effectiveStatus(post({ status: PostStatus.REMOVED }), later)).toBe(
      PostStatus.REMOVED,
    );
  });

  it('marks unconfirmed reports as possibly outdated, and a confirmation refreshes them', () => {
    const at = new Date(base.getTime() + 13 * H);
    expect(isStale(post(), at)).toBe(true);
    expect(
      isStale(post({ lastConfirmedAt: new Date(base.getTime() + 12 * H) }), at),
    ).toBe(false);
  });

  it('lost & found reports never go stale before they expire', () => {
    const lf = post({
      category: Category.LOST_FOUND,
      expiresAt: expiryFor(Category.LOST_FOUND, base),
    });
    expect(isStale(lf, new Date(base.getTime() + 20 * 24 * H))).toBe(false);
  });

  it('needs several independent confirmations and never overrides an official source', () => {
    expect(verificationFor(VerificationStatus.UNVERIFIED, 1)).toBe(
      VerificationStatus.UNVERIFIED,
    );
    expect(
      verificationFor(
        VerificationStatus.UNVERIFIED,
        COMMUNITY_CONFIRMATION_THRESHOLD,
      ),
    ).toBe(VerificationStatus.COMMUNITY_CONFIRMED);
    expect(verificationFor(VerificationStatus.COMMUNITY_CONFIRMED, 0)).toBe(
      VerificationStatus.UNVERIFIED,
    );
    expect(verificationFor(VerificationStatus.OFFICIAL_SOURCE, 0)).toBe(
      VerificationStatus.OFFICIAL_SOURCE,
    );
  });
});
