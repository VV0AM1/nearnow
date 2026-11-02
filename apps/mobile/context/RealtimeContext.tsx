import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { io, type Socket } from 'socket.io-client';
import api, { getAuthToken } from '@/services/api';
import { config } from '@/lib/config';
import { isPostPayload, parsePostUpdate, type PostUpdate } from '@/lib/realtime';
import type { Post } from '@/lib/types';
import { useAuth } from './AuthContext';

type PostListener = { created?: (post: Post) => void; updated?: (update: PostUpdate) => void };

interface RealtimeValue {
  connected: boolean;
  unread: number;
  /** Re-reads the unread count from the server (source of truth). */
  refreshUnread: () => void;
  /** Local change after marking notifications read; `null` sets it to zero. */
  adjustUnread: (delta: number | null) => void;
  /** Subscribe to public post events; returns an unsubscribe function. */
  onPosts: (listener: PostListener) => () => void;
}

const RealtimeContext = createContext<RealtimeValue | null>(null);

/**
 * One authenticated socket per signed-in session. It joins only the user's own
 * room (the server decides), disconnects in the background to save battery, and
 * re-syncs the unread count from the API after every (re)connect so nothing
 * missed while offline is lost.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [connected, setConnected] = useState(false);
  const [unread, setUnread] = useState(0);
  const listeners = useRef(new Set<PostListener>());
  const socket = useRef<Socket | null>(null);

  const refreshUnread = useCallback(() => {
    api
      .get<{ count: number }>('/notifications/me/unread-count')
      .then((res) => setUnread(res.data.count))
      .catch(() => undefined);
  }, []);

  const adjustUnread = useCallback((delta: number | null) => setUnread((n) => (delta === null ? 0 : Math.max(0, n + delta))), []);

  useEffect(() => {
    if (status !== 'signedIn' || !config.apiUrl) {
      setUnread(0);
      return;
    }
    const s = io(config.apiUrl, {
      transports: ['websocket'],
      // Read at every (re)connect so a refreshed token is used.
      auth: (cb) => cb({ token: getAuthToken() }),
      reconnectionDelay: 2_000,
      reconnectionDelayMax: 30_000,
    });
    socket.current = s;

    s.on('connect', () => {
      setConnected(true);
      refreshUnread();
    });
    s.on('disconnect', () => setConnected(false));
    // An expired session is handled by the API's 401 flow; just stop retrying here.
    s.on('auth_error', () => s.disconnect());
    s.on('notification', () => setUnread((n) => n + 1));
    s.on('postCreated', (raw: unknown) => {
      if (!isPostPayload(raw)) return;
      listeners.current.forEach((l) => l.created?.(raw));
    });
    s.on('postUpdated', (raw: unknown) => {
      const update = parsePostUpdate(raw);
      if (update) listeners.current.forEach((l) => l.updated?.(update));
    });

    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !s.connected) s.connect();
      else if (state === 'background') s.disconnect();
    });

    return () => {
      appState.remove();
      s.removeAllListeners();
      s.disconnect();
      socket.current = null;
      setConnected(false);
    };
  }, [status, refreshUnread]);

  // Keep the app icon badge in step (no-op where badges are not permitted).
  useEffect(() => {
    Notifications.setBadgeCountAsync(unread).catch(() => undefined);
  }, [unread]);

  const onPosts = useCallback((listener: PostListener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const value = useMemo(() => ({ connected, unread, refreshUnread, adjustUnread, onPosts }), [connected, unread, refreshUnread, adjustUnread, onPosts]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used inside RealtimeProvider');
  return ctx;
}
