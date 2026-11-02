import { AxiosError, AxiosHeaders } from 'axios';
import en from '../i18n/en';
import es from '../i18n/es';
import ca from '../i18n/ca';
import { translate } from '../i18n';
import { toAppError } from '../errors';
import { isExpired, tokenExpiry } from '../jwt';
import { parseMapMessage, toMapScript } from '../map-bridge';
import { buildPostFormData, emptyDraft, lostFoundRange } from '../post-form';
import { buildFeedParams, mergePages } from '../../hooks/useFeed';
import { enGB } from 'date-fns/locale';
import { groupByDay } from '../format';
import { circleRing, haversineKm, regionRadiusKm, zoomToDeltas } from '../geo';
import { clusterMarkers, project, zoomForSpan } from '../cluster';
import { matchesFeed, parsePostUpdate } from '../realtime';
import { briefLines, briefRadius } from '../brief';
import type { Post } from '../types';
import { mediaUrl } from '../config';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'es' }] }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => (typeof v === 'string' ? [`${prefix}${k}`] : keys(v, `${prefix}${k}.`)));
}

describe('i18n', () => {
  it('Spanish and Catalan define every English key and keep placeholders', () => {
    const enKeys = keys(en);
    for (const dict of [es, ca]) {
      expect(keys(dict).sort()).toEqual([...enKeys].sort());
      for (const k of enKeys) {
        const placeholders = (translate('en', k).match(/\{\w+\}/g) ?? []).sort();
        const other = dict === es ? 'es' : 'ca';
        expect([k, (translate(other, k).match(/\{\w+\}/g) ?? []).sort()]).toEqual([k, placeholders]);
      }
    }
  });

  it('interpolates and falls back to the key for unknown entries', () => {
    expect(translate('en', 'urgent.call', { number: '112' })).toBe('Call 112');
    expect(translate('ca', 'urgent.call', { number: '112' })).toBe('Truca al 112');
    expect(translate('en', 'does.not.exist')).toBe('does.not.exist');
  });

  it('never promises dispatch in the urgent-help copy', () => {
    for (const lang of ['en', 'es', 'ca'] as const) {
      const text = keys(en)
        .filter((k) => k.startsWith('urgent.'))
        .map((k) => translate(lang, k).toLowerCase())
        .join(' ');
      expect(text).not.toMatch(/help is on the way|ayuda está en camino|ajuda és en camí/);
    }
  });
});

describe('error adapter', () => {
  const axiosErr = (status: number | null, data?: unknown, code?: string) => {
    const e = new AxiosError('x', code);
    if (status !== null) e.response = { status, data, statusText: '', headers: {}, config: { headers: new AxiosHeaders() } };
    return e;
  };

  it('maps network failures to offline/timeout', () => {
    expect(toAppError(axiosErr(null)).kind).toBe('offline');
    expect(toAppError(axiosErr(null, undefined, 'ECONNABORTED')).kind).toBe('timeout');
  });

  it('joins validation messages and hides server error bodies', () => {
    expect(toAppError(axiosErr(400, { message: ['a', 'b'] }))).toMatchObject({ kind: 'validation', message: 'a\nb' });
    expect(toAppError(axiosErr(500, { message: 'stack trace here' }))).toMatchObject({ kind: 'server', message: null });
    expect(toAppError(axiosErr(429)).kind).toBe('rateLimited');
  });
});

describe('jwt expiry', () => {
  const token = (exp: number) => `x.${btoa(JSON.stringify({ exp })).replace(/=+$/, '')}.y`;
  it('reads exp and treats missing/garbage tokens as expired', () => {
    const now = Date.now();
    expect(tokenExpiry(token(now / 1000 + 3600))!.getTime()).toBeGreaterThan(now);
    expect(isExpired(token(now / 1000 + 3600), now)).toBe(false);
    expect(isExpired(token(now / 1000 - 10), now)).toBe(true);
    expect(isExpired('garbage')).toBe(true);
  });
});

describe('map bridge', () => {
  const id = '123e4567-e89b-12d3-a456-426614174000';
  it('accepts only well-formed messages', () => {
    expect(parseMapMessage(JSON.stringify({ type: 'MARKER_PRESS', id }))).toEqual({ type: 'MARKER_PRESS', id });
    expect(parseMapMessage(JSON.stringify({ type: 'MARKER_PRESS', id: '<img onerror=x>' }))).toBeNull();
    expect(parseMapMessage(JSON.stringify({ type: 'MOVE_END', lat: 95, lng: 0, radiusKm: 1 }))).toBeNull();
    expect(parseMapMessage(JSON.stringify({ type: 'NAVIGATE', payload: 'javascript:alert(1)' }))).toBeNull();
    expect(parseMapMessage('not json')).toBeNull();
  });

  it('drops markers with unexpected colours or ids before injecting', () => {
    const script = toMapScript({
      type: 'SET_MARKERS',
      markers: [
        { id, lat: 1, lng: 2, color: '#2563eb', shape: 'circle', dim: false },
        { id: 'evil"});alert(1);//', lat: 1, lng: 2, color: 'red;background:url(x)', shape: 'circle', dim: false },
      ],
    });
    expect(script).toContain(id);
    expect(script).not.toContain('alert(1)');
    expect(script).not.toContain('url(x)');
  });

  it('never sends marker labels (user text) into the WebView', () => {
    const script = toMapScript({ type: 'SET_MARKERS', markers: [{ id, lat: 1, lng: 2, color: '#2563eb', shape: 'circle', dim: false, label: '<img src=x onerror=alert(1)>' }] });
    expect(script).toContain(id);
    expect(script).not.toContain('onerror');
  });
});

describe('post form', () => {
  // React Native's FormData keeps entries in `_parts`; jest runs on Node's implementation.
  const NodeFormData = global.FormData;
  beforeAll(() => {
    global.FormData = class {
      _parts: [string, unknown][] = [];
      append(k: string, v: unknown) {
        this._parts.push([k, v]);
      }
    } as unknown as typeof FormData;
  });
  afterAll(() => {
    global.FormData = NodeFormData;
  });

  it('builds multipart fields including lost & found window and the file field', () => {
    const now = new Date(2026, 9, 19, 15, 0);
    const form = buildPostFormData(
      { ...emptyDraft(), category: 'LOST_FOUND', latitude: 0, longitude: 0, title: ' Keys ', lfDirection: 'LOST', lfItemType: 'KEYS', lfWindow: 'yesterday' },
      { uri: 'file:///x.jpg', mimeType: 'image/jpeg', fileName: 'photo.jpg' },
      now,
    ) as unknown as { _parts: [string, unknown][] };
    const fields = Object.fromEntries(form._parts);
    expect(fields).toMatchObject({ title: 'Keys', category: 'LOST_FOUND', latitude: '0', longitude: '0', approximateLocation: 'true', lostFoundDirection: 'LOST' });
    expect(fields.file).toEqual({ uri: 'file:///x.jpg', name: 'photo.jpg', type: 'image/jpeg' });
    const { from, to } = lostFoundRange('yesterday', now);
    expect(to.getTime() - from.getTime()).toBe(86_400_000);
  });

  it('refuses incomplete drafts', () => {
    expect(() => buildPostFormData(emptyDraft(), null)).toThrow();
  });
});

describe('feed paging', () => {
  it('only sends filters that are set', () => {
    expect(buildFeedParams({ latitude: 1, longitude: 2, radius: 5, since: 'all' }, 1)).toEqual({ latitude: 1, longitude: 2, radius: 5, page: 1, limit: 20 });
    expect(buildFeedParams({ latitude: 1, longitude: 2, radius: 5, categories: ['EVENT'], since: '24h', search: ' x ' }, 2)).toMatchObject({ category: 'EVENT', since: '24h', search: 'x', page: 2 });
  });

  it('suppresses duplicates across pages', () => {
    const p = (id: string) => ({ id }) as never;
    expect(mergePages([p('a'), p('b')], [p('b'), p('c')]).map((x: { id: string }) => x.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('media urls', () => {
  it('only resolves server upload paths', () => {
    expect(mediaUrl('/uploads/a.jpg')).toMatch(/\/uploads\/a\.jpg$/);
    expect(mediaUrl('/etc/passwd')).toBeNull();
    expect(mediaUrl(null)).toBeNull();
  });
});

describe('groupByDay', () => {
  const labels = { today: 'Today', yesterday: 'Yesterday' };
  const now = new Date(2026, 9, 20, 15, 0);
  const at = (d: number, h: number) => ({ createdAt: new Date(2026, 9, d, h).toISOString() });

  it('splits newest-first items into Today, Yesterday and dated sections', () => {
    const sections = groupByDay([at(20, 14), at(20, 1), at(19, 22), at(17, 9), at(17, 8)], labels, enGB, now);
    expect(sections.map((s) => [s.title, s.data.length])).toEqual([
      ['Today', 2],
      ['Yesterday', 1],
      ['Saturday 17 October', 2],
    ]);
  });

  it('adds the year for items from an earlier year', () => {
    expect(groupByDay([{ createdAt: new Date(2025, 11, 31, 12).toISOString() }], labels, enGB, now)[0].title).toBe('31 December 2025');
  });
});

describe('geo helpers', () => {
  it('measures great-circle distance', () => {
    // Barcelona (Plaça de Catalunya) to Madrid (Puerta del Sol) is about 505 km.
    expect(haversineKm(41.387, 2.170, 40.417, -3.704)).toBeGreaterThan(495);
    expect(haversineKm(41.387, 2.170, 40.417, -3.704)).toBeLessThan(515);
    expect(haversineKm(41.4, 2.17, 41.4, 2.17)).toBe(0);
  });

  it('reports a region radius as the centre-to-corner distance', () => {
    const r = regionRadiusKm({ latitude: 41.4, longitude: 2.17, latitudeDelta: 0.02, longitudeDelta: 0.02 });
    expect(r).toBeCloseTo(haversineKm(41.4, 2.17, 41.41, 2.18), 6);
  });

  it('halves the span for each zoom level', () => {
    const a = zoomToDeltas(14, 41.4, 400, 800);
    const b = zoomToDeltas(15, 41.4, 400, 800);
    expect(a.longitudeDelta / b.longitudeDelta).toBeCloseTo(2, 6);
    expect(a.latitudeDelta).toBeGreaterThan(a.longitudeDelta); // taller than wide
  });

  it('builds a closed circle whose points sit at the radius', () => {
    const ring = circleRing(41.4, 2.17, 2, 32);
    expect(ring).toHaveLength(33);
    expect(ring[0]).toEqual(ring[32]);
    for (const [lng, lat] of ring) expect(haversineKm(41.4, 2.17, lat, lng)).toBeCloseTo(2, 1);
  });
});

describe('marker clustering', () => {
  const pt = (id: string, lat: number, lng: number) => ({ id, lat, lng });
  // Two posts ~50 m apart and one ~3 km away.
  const items = [pt('a', 41.3870, 2.1700), pt('b', 41.3874, 2.1703), pt('c', 41.4100, 2.1900)];

  it('groups nearby markers when zoomed out and splits them when zoomed in', () => {
    const far = clusterMarkers(items, 13);
    expect(far.map((c) => c.kind)).toEqual(['cluster', 'single']);
    const cluster = far[0];
    expect(cluster.kind === 'cluster' && cluster.items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(clusterMarkers(items, 19).every((c) => c.kind === 'single')).toBe(true);
  });

  it('places a cluster at the mean position with a stable key', () => {
    const [c] = clusterMarkers([pt('b', 1, 1), pt('a', 1.0001, 1.0001)], 10);
    expect(c.kind).toBe('cluster');
    if (c.kind === 'cluster') {
      expect(c.key).toBe('a|b');
      expect(c.lat).toBeCloseTo(1.00005, 6);
    }
  });

  it('round-trips zoom from a span and projects consistently', () => {
    expect(zoomForSpan(zoomToDeltas(15, 41.4, 390, 700).longitudeDelta, 390)).toBeCloseTo(15, 6);
    const a = project(41.4, 2.17, 10);
    const b = project(41.4, 2.17, 11);
    expect(b.x / a.x).toBeCloseTo(2, 6);
  });
});

describe('real-time feed matching', () => {
  const query = { latitude: 41.387, longitude: 2.17, radius: 2 };
  const post = (over: Partial<Post> = {}) =>
    ({ id: '123e4567-e89b-12d3-a456-426614174000', latitude: 41.39, longitude: 2.172, category: 'EVENT', status: 'ACTIVE', author: { id: 'someone', name: 'A', avatar: null }, ...over }) as Post;

  it('accepts active posts inside the radius and matching filters', () => {
    expect(matchesFeed(post(), query, 'me')).toBe(true);
    expect(matchesFeed(post(), { ...query, categories: ['EVENT'] }, 'me')).toBe(true);
  });

  it('rejects own posts, far posts, other categories, inactive posts and searches', () => {
    expect(matchesFeed(post({ author: { id: 'me', name: 'Me', avatar: null } }), query, 'me')).toBe(false);
    expect(matchesFeed(post({ latitude: 41.5 }), query, 'me')).toBe(false);
    expect(matchesFeed(post(), { ...query, categories: ['GENERAL'] }, 'me')).toBe(false);
    expect(matchesFeed(post({ status: 'RESOLVED' }), query, 'me')).toBe(false);
    expect(matchesFeed(post(), { ...query, search: 'market' }, 'me')).toBe(false);
  });

  it('validates postUpdated payloads', () => {
    expect(parsePostUpdate({ id: '123e4567-e89b-12d3-a456-426614174000', status: 'REMOVED' })).toEqual({ id: '123e4567-e89b-12d3-a456-426614174000', status: 'REMOVED' });
    expect(parsePostUpdate({ id: 'x', status: 'REMOVED' })).toBeNull();
    expect(parsePostUpdate({ id: '123e4567-e89b-12d3-a456-426614174000', status: 'HACKED' })).toBeNull();
    expect(parsePostUpdate(null)).toBeNull();
  });
});

describe('local change brief', () => {
  const zero = { new: 0, confirmed: 0, resolved: 0, expired: 0, unconfirmedNew: 0, official: 0 };

  it('says nothing new was found — and warns about coverage when the area is quiet', () => {
    expect(briefLines({ counts: zero, activeInArea: 0 }).map((l) => l.key)).toEqual(['brief.noneFound', 'brief.coverageLow']);
    expect(briefLines({ counts: zero, activeInArea: 4 }).map((l) => l.key)).toEqual(['brief.noneFound', 'brief.coverageNote']);
  });

  it('summarises each kind of change and flags unconfirmed new posts', () => {
    const lines = briefLines({ counts: { ...zero, new: 3, resolved: 1, unconfirmedNew: 2 }, activeInArea: 9 });
    expect(lines.map((l) => [l.key, l.params?.n, l.tone])).toEqual([
      ['brief.lineNew', 3, 'neutral'],
      ['brief.lineResolved', 1, 'neutral'],
      ['brief.lineUnconfirmed', 2, 'warning'],
    ]);
  });

  it('keeps the brief radius within what the API accepts', () => {
    expect(briefRadius(25)).toBe(10);
    expect(briefRadius(0.1)).toBe(0.5);
    expect(briefRadius(2)).toBe(2);
  });
});
