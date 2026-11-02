/** Reads the `exp` claim of a JWT without verifying it (the server verifies). */
export function tokenExpiry(token: string): Date | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(part.length + ((4 - (part.length % 4)) % 4), '=');
    const json = JSON.parse(globalThis.atob(b64)) as { exp?: unknown };
    return typeof json.exp === 'number' ? new Date(json.exp * 1000) : null;
  } catch {
    return null;
  }
}

export function isExpired(token: string, now = Date.now(), skewMs = 30_000): boolean {
  const exp = tokenExpiry(token);
  return !exp || exp.getTime() - skewMs <= now;
}
