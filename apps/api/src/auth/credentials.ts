import { createHash, randomInt, timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

let dummy: Promise<string> | null = null;
const dummyHash = () =>
  (dummy ??= bcrypt.hash('nearnow-timing-equaliser', BCRYPT_ROUNDS));

export function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // Still spend comparable time so length differences are not observable.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export interface PasswordCheck {
  valid: boolean;
  /** True when the stored value is legacy plaintext and must be re-hashed. */
  needsRehash: boolean;
}

/**
 * Verifies a password against the stored value. Older rows stored plaintext; those are
 * accepted once (constant-time compare) and flagged so the caller replaces them with a hash.
 */
export async function verifyPassword(
  password: string,
  stored: string | null | undefined,
): Promise<PasswordCheck> {
  if (!stored) {
    // Burn a hash round so "no password" and "wrong password" take similar time.
    await bcrypt.compare(password, await dummyHash());
    return { valid: false, needsRehash: false };
  }
  if (isBcryptHash(stored)) {
    return {
      valid: await bcrypt.compare(password, stored),
      needsRehash: false,
    };
  }
  const valid = safeEqual(password, stored);
  return { valid, needsRehash: valid };
}

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashOtp(email: string, otp: string): string {
  return createHash('sha256')
    .update(`${email.toLowerCase()}:${otp}`)
    .digest('hex');
}

export function otpMatches(
  email: string,
  otp: string,
  storedHash: string,
): boolean {
  return safeEqual(hashOtp(email, otp), storedHash);
}
