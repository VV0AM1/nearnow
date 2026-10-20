import {
  generateOtp,
  hashOtp,
  hashPassword,
  isBcryptHash,
  otpMatches,
  verifyPassword,
} from './credentials';
import { loadConfig } from '../common/env';

describe('credentials', () => {
  it('hashes passwords with bcrypt and verifies them', async () => {
    const hash = await hashPassword('correct horse');
    expect(isBcryptHash(hash)).toBe(true);
    expect(hash).not.toContain('correct horse');
    expect(await verifyPassword('correct horse', hash)).toEqual({
      valid: true,
      needsRehash: false,
    });
    expect((await verifyPassword('wrong', hash)).valid).toBe(false);
  });

  it('accepts a legacy plaintext value once and flags it for re-hashing', async () => {
    expect(await verifyPassword('legacy-pass', 'legacy-pass')).toEqual({
      valid: true,
      needsRehash: true,
    });
    expect(await verifyPassword('nope', 'legacy-pass')).toEqual({
      valid: false,
      needsRehash: false,
    });
  });

  it('rejects accounts without a password', async () => {
    expect((await verifyPassword('anything', null)).valid).toBe(false);
  });

  it('generates 6-digit codes and stores only a hash bound to the email', () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
    const h = hashOtp('a@example.com', otp);
    expect(h).not.toContain(otp);
    expect(otpMatches('A@Example.com', otp, h)).toBe(true);
    expect(otpMatches('b@example.com', otp, h)).toBe(false);
    expect(
      otpMatches('a@example.com', '123456', hashOtp('a@example.com', '654321')),
    ).toBe(false);
  });
});

describe('startup configuration', () => {
  it('refuses to start in production without secrets or CORS origins', () => {
    expect(() =>
      loadConfig({ NODE_ENV: 'production', DATABASE_URL: 'x' }),
    ).toThrow(/JWT_SECRET is required/);
    expect(() =>
      loadConfig({
        NODE_ENV: 'production',
        DATABASE_URL: 'x',
        JWT_SECRET: 'short',
      }),
    ).toThrow(/at least 32/);
    expect(() =>
      loadConfig({
        NODE_ENV: 'production',
        DATABASE_URL: 'x',
        JWT_SECRET: 'x'.repeat(40),
      }),
    ).toThrow(/CORS_ORIGINS/);
  });

  it('allows development defaults and parses origins', () => {
    const c = loadConfig({
      DATABASE_URL: 'x',
      CORS_ORIGINS: 'https://a.example, https://b.example',
    });
    expect(c.corsOrigins).toEqual(['https://a.example', 'https://b.example']);
    expect(c.pushProvider).toBeNull();
  });

  it('requires an identifying user agent before enabling Nominatim', () => {
    expect(() =>
      loadConfig({ DATABASE_URL: 'x', GEOCODER_PROVIDER: 'nominatim' }),
    ).toThrow(/GEOCODER_USER_AGENT/);
  });
});
