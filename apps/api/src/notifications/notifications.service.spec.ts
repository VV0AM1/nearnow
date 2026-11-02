import { Category } from '@prisma/client';
import {
  AlertSettings,
  decideAlert,
  inQuietHours,
  URGENT_MAX_RADIUS_KM,
} from './alert-policy';

const settings = (over: Partial<AlertSettings> = {}): AlertSettings => ({
  userId: 'reader',
  latitude: 41.39,
  longitude: 2.17,
  radiusKm: 5,
  categories: [Category.GENERAL, Category.DANGER],
  paused: false,
  pushEnabled: true,
  quietHoursStart: null,
  quietHoursEnd: null,
  timezone: 'Europe/Madrid',
  ...over,
});
const post = (
  over: Partial<{
    category: Category;
    latitude: number;
    longitude: number;
    authorId: string;
  }> = {},
) => ({
  authorId: 'author',
  category: Category.GENERAL,
  latitude: 41.392,
  longitude: 2.171,
  ...over,
});

describe('alert policy', () => {
  it('notifies an opted-in person inside their area', () => {
    expect(decideAlert(settings(), post())).toMatchObject({
      notify: true,
      push: true,
    });
  });

  it('never notifies the author about their own post', () => {
    expect(decideAlert(settings({ userId: 'author' }), post())).toEqual({
      notify: false,
      reason: 'AUTHOR',
    });
  });

  it('does not alert people without a chosen area — (0,0) is no longer a fallback', () => {
    expect(
      decideAlert(settings({ latitude: null, longitude: null }), post()),
    ).toEqual({ notify: false, reason: 'NO_AREA' });
  });

  it('urgent requests are NOT broadcast: they need the DANGER opt-in like any category', () => {
    expect(
      decideAlert(
        settings({ categories: [Category.GENERAL] }),
        post({ category: Category.DANGER }),
      ),
    ).toEqual({
      notify: false,
      reason: 'CATEGORY_NOT_CHOSEN',
    });
  });

  it('caps urgent requests to a short distance even with a large radius', () => {
    const far = post({
      category: Category.DANGER,
      latitude: 41.39 + (URGENT_MAX_RADIUS_KM + 1) / 111,
    });
    expect(decideAlert(settings({ radiusKm: 25 }), far)).toEqual({
      notify: false,
      reason: 'OUT_OF_RANGE',
    });
  });

  it('respects pause', () => {
    expect(decideAlert(settings({ paused: true }), post())).toEqual({
      notify: false,
      reason: 'PAUSED',
    });
  });

  it('suppresses push (not the in-app item) during quiet hours, including windows over midnight', () => {
    const s = settings({
      quietHoursStart: 22 * 60,
      quietHoursEnd: 7 * 60,
      timezone: 'UTC',
    });
    expect(inQuietHours(s, new Date('2026-10-19T23:30:00Z'))).toBe(true);
    expect(inQuietHours(s, new Date('2026-10-19T06:59:00Z'))).toBe(true);
    expect(inQuietHours(s, new Date('2026-10-19T12:00:00Z'))).toBe(false);
    expect(
      decideAlert(s, post(), new Date('2026-10-19T23:30:00Z')),
    ).toMatchObject({ notify: true, push: false });
  });

  it('no push when the person did not enable it', () => {
    expect(decideAlert(settings({ pushEnabled: false }), post())).toMatchObject(
      { notify: true, push: false },
    );
  });
});
