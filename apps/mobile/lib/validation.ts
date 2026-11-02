export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const isOtp = (v: string) => /^\d{6}$/.test(v.trim());
export const PASSWORD_MIN = 8;
export const TITLE_MIN = 3;
export const TITLE_MAX = 120;
export const CONTENT_MAX = 2000;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validTitle(v: string) {
  const len = v.trim().length;
  return len >= TITLE_MIN && len <= TITLE_MAX;
}
