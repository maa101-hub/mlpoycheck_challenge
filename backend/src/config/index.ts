import dotenv from 'dotenv';

dotenv.config();

/**
 * Application configuration
 * Centralizes all environment variables and defaults
 */
const INSECURE_DEFAULT_SECRET = 'default_secret_key';
const isProduction = process.env.NODE_ENV === 'production';

const jwtSecret = process.env.JWT_SECRET || INSECURE_DEFAULT_SECRET;

/**
 * Fail fast on a missing/weak JWT secret in production. A publicly-known or
 * short secret would let anyone forge admin tokens, so we refuse to boot rather
 * than run insecurely. In non-production we allow the dev fallback (with a warning).
 */
if (isProduction && (jwtSecret === INSECURE_DEFAULT_SECRET || jwtSecret.length < 16)) {
  throw new Error(
    'JWT_SECRET is missing or too weak. Set a strong (>=16 char) JWT_SECRET environment variable in production.'
  );
}
if (!isProduction && jwtSecret === INSECURE_DEFAULT_SECRET) {
  console.warn('⚠️  Using the insecure default JWT secret. Set JWT_SECRET before deploying.');
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  // Postgres connection string (e.g. from Neon). Required in production.
  databaseUrl: process.env.DATABASE_URL || '',
  // Managed Postgres (Neon/Render/Supabase) requires SSL. Disable only for a
  // local Postgres without TLS by setting DATABASE_SSL=false.
  databaseSsl: (process.env.DATABASE_SSL || 'true').toLowerCase() !== 'false',
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  // Comma-separated list of allowed frontend origins for CORS (e.g. your
  // Vercel URL). Falls back to localhost dev ports when unset.
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:4200,http://localhost:4201')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean),
  // Simulated API delay in milliseconds for async processing demo
  apiDelay: parseInt(process.env.API_DELAY || '1500', 10),
};
