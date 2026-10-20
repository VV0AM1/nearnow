import Constants from 'expo-constants';

/**
 * Build-time configuration from EXPO_PUBLIC_* variables (see .env.example).
 * Nothing secret belongs here: these values are embedded in the app bundle.
 */
function readUrl(raw: string | undefined): { url: string | null; error: string | null } {
  const value = raw?.trim().replace(/\/+$/, '');
  if (!value) return { url: null, error: 'EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env and set the API address.' };
  if (!/^https?:\/\/[^\s/]+/.test(value)) return { url: null, error: `EXPO_PUBLIC_API_URL "${value}" is not a valid http(s) URL.` };
  return { url: value, error: null };
}

const api = readUrl(process.env.EXPO_PUBLIC_API_URL);

/** Set by `eas init` in app.json (extra.eas.projectId); the env var can override it. */
const appJsonProjectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;

export const config = {
  apiUrl: api.url ?? '',
  /** Non-null when the build is misconfigured; the app shows a configuration screen. */
  configError: api.error,
  easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() || appJsonProjectId || null,
  privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() || null,
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || null,
  /** EU-wide emergency number; NearNow is not an emergency service. */
  emergencyNumber: '112',
};

/** Absolute URL for a server-relative upload path such as "/uploads/abc.jpg". */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (!path.startsWith('/uploads/')) return null;
  return `${config.apiUrl}${path}`;
}
