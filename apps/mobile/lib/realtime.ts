import { haversineKm } from './geo';
import type { Post } from './types';
import type { FeedQuery } from '../hooks/useFeed';

/** Payload of the public `postUpdated` event. */
export interface PostUpdate {
  id: string;
  status: Post['status'];
}

const ID = /^[0-9a-f-]{36}$/i;
const STATUSES: Post['status'][] = ['ACTIVE', 'RESOLVED', 'EXPIRED', 'REMOVED'];

/** Validates a socket payload before it touches app state. */
export function parsePostUpdate(raw: unknown): PostUpdate | null {
  const m = raw as Partial<PostUpdate> | null;
  return m && typeof m.id === 'string' && ID.test(m.id) && STATUSES.includes(m.status as Post['status']) ? { id: m.id, status: m.status as Post['status'] } : null;
}

export function isPostPayload(raw: unknown): raw is Post {
  const p = raw as Partial<Post> | null;
  return !!p && typeof p.id === 'string' && ID.test(p.id) && typeof p.latitude === 'number' && typeof p.longitude === 'number' && typeof p.category === 'string';
}

/**
 * Would this newly created post appear in the feed the user is looking at?
 * Mirrors the server filters that can be checked locally (area, radius,
 * category, direction). Search text is not matched, so searches never show the pill.
 */
export function matchesFeed(post: Post, query: FeedQuery, viewerId: string | null): boolean {
  if (viewerId && post.author?.id === viewerId) return false; // you already know about your own post
  if (post.status !== 'ACTIVE') return false;
  if (query.search) return false;
  if (query.categories?.length && !query.categories.includes(post.category)) return false;
  if (query.lostFoundDirection && post.lostFound?.direction !== query.lostFoundDirection) return false;
  return haversineKm(query.latitude, query.longitude, post.latitude, post.longitude) <= query.radius;
}
