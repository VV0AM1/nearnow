import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, { setAuthToken, setUnauthorizedHandler } from '@/services/api';
import { getString, KEYS, setString } from '@/lib/storage';
import { isExpired, tokenExpiry } from '@/lib/jwt';
import { toAppError } from '@/lib/errors';
import type { Profile } from '@/lib/types';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';
export type SignOutReason = 'user' | 'expired' | 'deleted';

interface AuthValue {
  status: AuthStatus;
  /** Loaded profile; null while loading it or when the network is unavailable. */
  user: Profile | null;
  /** Message to show on the login screen after an involuntary sign-out. */
  notice: SignOutReason | null;
  signIn: (token: string) => Promise<void>;
  signOut: (reason?: SignOutReason) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearNotice: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Hooks registered here run before the token is dropped (e.g. revoke push token). */
const beforeSignOut = new Set<() => Promise<void>>();
export function onBeforeSignOut(fn: () => Promise<void>) {
  beforeSignOut.add(fn);
  return () => beforeSignOut.delete(fn);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<Profile | null>(null);
  const [notice, setNotice] = useState<SignOutReason | null>(null);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signingOut = useRef(false);

  const clearSession = useCallback(async (reason: SignOutReason) => {
    if (signingOut.current) return; // many requests may 401 at once: clear only once
    signingOut.current = true;
    try {
      if (reason === 'user') {
        for (const fn of beforeSignOut) await fn().catch(() => undefined);
      }
      if (expiryTimer.current) clearTimeout(expiryTimer.current);
      setAuthToken(null);
      await setString(KEYS.token, null);
      await setString(KEYS.legacyToken, null);
      setUser(null);
      setNotice(reason === 'user' ? null : reason);
      setStatus('signedOut');
    } finally {
      signingOut.current = false;
    }
  }, []);

  const scheduleExpiry = useCallback(
    (token: string) => {
      if (expiryTimer.current) clearTimeout(expiryTimer.current);
      const exp = tokenExpiry(token);
      if (!exp) return;
      // setTimeout overflows above ~24.8 days; re-check on the next app start instead.
      const ms = Math.min(exp.getTime() - Date.now(), 2 ** 31 - 1);
      expiryTimer.current = setTimeout(() => void clearSession('expired'), Math.max(0, ms));
    },
    [clearSession],
  );

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<Profile>('/users/me');
      setUser(res.data);
    } catch (e) {
      // 401 is handled by the interceptor; offline keeps the session usable.
      if (toAppError(e).kind !== 'unauthorized') throw e;
    }
  }, []);

  const signIn = useCallback(
    async (token: string) => {
      setAuthToken(token);
      await setString(KEYS.token, token);
      setNotice(null);
      scheduleExpiry(token);
      setStatus('signedIn');
      await refreshUser().catch(() => undefined);
    },
    [refreshUser, scheduleExpiry],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => void clearSession('expired'));
    (async () => {
      const token = (await getString(KEYS.token)) ?? (await getString(KEYS.legacyToken));
      if (!token || isExpired(token)) {
        await setString(KEYS.token, null);
        await setString(KEYS.legacyToken, null);
        if (token) setNotice('expired');
        setStatus('signedOut');
        return;
      }
      setAuthToken(token);
      scheduleExpiry(token);
      setStatus('signedIn');
      await refreshUser().catch(() => undefined);
    })();
    return () => {
      setUnauthorizedHandler(null);
      if (expiryTimer.current) clearTimeout(expiryTimer.current);
    };
  }, [clearSession, refreshUser, scheduleExpiry]);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      user,
      notice,
      signIn,
      signOut: (reason = 'user') => clearSession(reason),
      refreshUser,
      clearNotice: () => setNotice(null),
    }),
    [status, user, notice, signIn, clearSession, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
