import axios, { AxiosHeaders } from 'axios';
import { config } from '@/lib/config';

/** Configured from EXPO_PUBLIC_API_URL (never hardcoded). */
export const API_URL = config.apiUrl;

const api = axios.create({ baseURL: API_URL, timeout: 30_000 });

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Called by AuthContext; requests read the token from memory, not SecureStore. */
export function setAuthToken(token: string | null) {
  authToken = token;
}

/** AuthContext registers one handler that clears the session exactly once. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.request.use((req) => {
  if (authToken) {
    const headers = AxiosHeaders.from(req.headers);
    headers.set('Authorization', `Bearer ${authToken}`);
    req.headers = headers;
  }
  return req;
});

const AUTH_ROUTES = /\/auth\/(login|signup|otp\/verify|forgot-password|reset-password)/;

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? '';
    const sentToken = Boolean(error?.config?.headers?.Authorization);
    if (status === 401 && sentToken && !AUTH_ROUTES.test(url)) onUnauthorized?.();
    return Promise.reject(error);
  },
);

export default api;
