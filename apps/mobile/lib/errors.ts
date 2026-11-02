import { isAxiosError } from 'axios';

export type ErrorKind = 'offline' | 'timeout' | 'unauthorized' | 'forbidden' | 'notFound' | 'rateLimited' | 'validation' | 'server' | 'unknown';

export interface AppError {
  kind: ErrorKind;
  /** Server-provided message when it is safe to show, otherwise null (use a translated fallback). */
  message: string | null;
  status?: number;
}

/** Normalises axios/network failures into one shape the UI can render. */
export function toAppError(err: unknown): AppError {
  if (isAxiosError(err)) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') return { kind: 'timeout', message: null };
    if (!err.response) return { kind: 'offline', message: null };
    const status = err.response.status;
    const data = err.response.data as { message?: unknown } | undefined;
    const raw = data?.message;
    const message = Array.isArray(raw) ? raw.filter((m) => typeof m === 'string').join('\n') || null : typeof raw === 'string' ? raw : null;
    if (status === 401) return { kind: 'unauthorized', message, status };
    if (status === 403) return { kind: 'forbidden', message, status };
    if (status === 404) return { kind: 'notFound', message, status };
    if (status === 429) return { kind: 'rateLimited', message, status };
    if (status === 400 || status === 409 || status === 422) return { kind: 'validation', message, status };
    // Never show raw 5xx bodies to users.
    if (status >= 500) return { kind: 'server', message: null, status };
    return { kind: 'unknown', message, status };
  }
  return { kind: 'unknown', message: null };
}

/** i18n key for the generic message of each error kind. */
export const ERROR_KEYS: Record<ErrorKind, string> = {
  offline: 'error.offline',
  timeout: 'error.timeout',
  unauthorized: 'error.unauthorized',
  forbidden: 'error.forbidden',
  notFound: 'error.notFound',
  rateLimited: 'error.rateLimited',
  validation: 'error.validation',
  server: 'error.server',
  unknown: 'error.unknown',
};

export function describeError(err: unknown, t: (key: string) => string): string {
  const e = toAppError(err);
  if (e.message && e.kind !== 'server') return e.message;
  return t(ERROR_KEYS[e.kind]);
}
