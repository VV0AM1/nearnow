/**
 * Startup configuration checks. Fails fast in production when a required value is
 * missing instead of silently falling back to an insecure default.
 */
export interface AppConfig {
  isProduction: boolean;
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigins: string[];
  uploadDir: string;
  publicBaseUrl: string | null;
  emailConfigured: boolean;
  pushProvider: 'expo' | null;
  geocoderProvider: 'nominatim' | null;
  geocoderUserAgent: string | null;
}

const DEV_JWT_SECRET = 'nearnow-dev-only-secret-do-not-use-in-production';

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const isProduction = env.NODE_ENV === 'production';
  const errors: string[] = [];

  if (!env.DATABASE_URL) errors.push('DATABASE_URL is required');

  let jwtSecret = env.JWT_SECRET ?? '';
  if (!jwtSecret) {
    if (isProduction) errors.push('JWT_SECRET is required in production');
    jwtSecret = DEV_JWT_SECRET;
  } else if (isProduction && jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters in production');
  }

  const corsOrigins = (env.CORS_ORIGINS || env.FRONTEND_URL || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (!corsOrigins.length) {
    if (isProduction)
      errors.push(
        'CORS_ORIGINS is required in production (comma-separated web origins)',
      );
    corsOrigins.push('http://localhost:3000', 'http://localhost:3001');
  }

  const publicBaseUrl = env.PUBLIC_BASE_URL?.replace(/\/+$/, '') || null;
  if (publicBaseUrl && !/^https?:\/\//.test(publicBaseUrl)) {
    errors.push('PUBLIC_BASE_URL must start with http:// or https://');
  }

  const pushProvider = env.PUSH_PROVIDER === 'expo' ? 'expo' : null;
  if (env.PUSH_PROVIDER && !pushProvider)
    errors.push(`Unsupported PUSH_PROVIDER "${env.PUSH_PROVIDER}"`);

  const geocoderProvider =
    env.GEOCODER_PROVIDER === 'nominatim' ? 'nominatim' : null;
  if (env.GEOCODER_PROVIDER && !geocoderProvider) {
    errors.push(`Unsupported GEOCODER_PROVIDER "${env.GEOCODER_PROVIDER}"`);
  }
  if (geocoderProvider && !env.GEOCODER_USER_AGENT) {
    errors.push(
      'GEOCODER_USER_AGENT (including contact details) is required when GEOCODER_PROVIDER=nominatim',
    );
  }

  if (errors.length) {
    throw new Error(`Invalid configuration:\n - ${errors.join('\n - ')}`);
  }

  return {
    isProduction,
    port: Number(env.PORT) || 3002,
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
    corsOrigins,
    uploadDir: env.UPLOAD_DIR || './uploads',
    publicBaseUrl,
    emailConfigured: Boolean(env.EMAIL_USER && env.EMAIL_PASS),
    pushProvider,
    geocoderProvider,
    geocoderUserAgent: env.GEOCODER_USER_AGENT || null,
  };
}

let cached: AppConfig | null = null;

export function appConfig(): AppConfig {
  if (!cached) cached = loadConfig();
  return cached;
}

/** Test hook. */
export function resetAppConfig() {
  cached = null;
}
