import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/services/api';
import type { Category, LostFoundDirection, Post, TimeWindow } from '@/lib/types';
import type { PostUpdate } from '@/lib/realtime';

export interface FeedQuery {
  latitude: number;
  longitude: number;
  radius: number;
  categories?: Category[];
  since?: TimeWindow;
  search?: string;
  lostFoundDirection?: LostFoundDirection;
  includeInactive?: boolean;
  limit?: number;
}

export function buildFeedParams(q: FeedQuery, page: number) {
  return {
    latitude: q.latitude,
    longitude: q.longitude,
    radius: q.radius,
    ...(q.categories?.length ? { category: q.categories.join(',') } : {}),
    ...(q.since && q.since !== 'all' ? { since: q.since } : {}),
    ...(q.search?.trim() ? { search: q.search.trim() } : {}),
    ...(q.lostFoundDirection ? { lostFoundDirection: q.lostFoundDirection } : {}),
    ...(q.includeInactive ? { includeInactive: 'true' } : {}),
    page,
    limit: q.limit ?? 20,
  };
}

/** Appends a page, dropping posts already shown (new posts can shift offsets). */
export function mergePages(existing: Post[], incoming: Post[]): Post[] {
  const seen = new Set(existing.map((p) => p.id));
  return [...existing, ...incoming.filter((p) => !seen.has(p.id))];
}

/** Paginated `/posts/feed`. Pass `null` while no area is selected. */
export function useFeed(query: FeedQuery | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const controller = useRef<AbortController | null>(null);
  const key = query ? JSON.stringify(query) : null;

  const load = useCallback(
    async (targetPage: number, mode: 'initial' | 'refresh' | 'more') => {
      if (!query) return;
      controller.current?.abort();
      const ctrl = new AbortController();
      controller.current = ctrl;
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      if (mode === 'more') setLoadingMore(true);
      setError(null);
      try {
        const limit = query.limit ?? 20;
        const res = await api.get<Post[]>('/posts/feed', { params: buildFeedParams(query, targetPage), signal: ctrl.signal });
        if (ctrl.signal.aborted) return;
        setPosts((prev) => (targetPage === 1 ? res.data : mergePages(prev, res.data)));
        setPage(targetPage);
        setHasMore(res.data.length === limit);
      } catch (e) {
        if (ctrl.signal.aborted) return;
        setError(e);
      } finally {
        if (!ctrl.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  useEffect(() => {
    setPosts([]);
    setHasMore(true);
    if (query) void load(1, 'initial');
    return () => controller.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /** Live status change from the socket: removed posts disappear, others update in place. */
  const applyUpdate = useCallback(
    (u: PostUpdate) => setPosts((prev) => (u.status === 'REMOVED' ? prev.filter((p) => p.id !== u.id) : prev.map((p) => (p.id === u.id ? { ...p, status: u.status } : p)))),
    [],
  );

  return {
    posts,
    applyUpdate,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    refresh: () => load(1, 'refresh'),
    retry: () => load(1, 'initial'),
    loadMore: () => {
      if (hasMore && !loading && !loadingMore && !refreshing && !error) void load(page + 1, 'more');
    },
    /** Local patch after an action on the detail screen. */
    replace: (post: Post) => setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p))),
  };
}
