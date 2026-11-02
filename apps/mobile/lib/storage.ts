import * as SecureStore from 'expo-secure-store';

/**
 * Small persistent key-value store. SecureStore is used for everything (token and
 * preferences) because it is already a dependency; values are tiny.
 */
export const KEYS = {
  token: 'nn.token',
  legacyToken: 'token',
  locale: 'nn.locale',
  theme: 'user_theme_preference',
  area: 'nn.area',
  onboarded: 'nn.onboarded',
  feedRadius: 'nn.feedRadius',
  pushToken: 'nn.pushToken',
  cantConfirm: 'nn.cantConfirm',
} as const;

export async function getString(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setString(key: string, value: string | null): Promise<void> {
  try {
    if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // Preferences are best-effort; the app keeps working with in-memory state.
  }
}

export async function getJSON<T>(key: string, validate: (v: unknown) => v is T): Promise<T | null> {
  const raw = await getString(key);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setJSON(key: string, value: unknown) {
  return setString(key, value === null ? null : JSON.stringify(value));
}

/** Posts the user said they can't confirm; the question is not shown again on this device. Capped. */
export async function getCantConfirm(): Promise<string[]> {
  return (await getJSON(KEYS.cantConfirm, (v): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string'))) ?? [];
}

export async function addCantConfirm(postId: string): Promise<void> {
  const ids = (await getCantConfirm()).filter((id) => id !== postId);
  await setString(KEYS.cantConfirm, JSON.stringify([postId, ...ids].slice(0, 200)));
}
