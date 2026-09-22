import dotenv from 'dotenv';

dotenv.config();

/**
 * Application configuration
 * Centralizes all environment variables and defaults
 */
export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  // Postgres connection string (e.g. from Neon). Required in production.
  databaseUrl: process.env.DATABASE_URL || '',
  // Managed Postgres (Neon/Render/Supabase) requires SSL. Disable only for a
  // local Postgres without TLS by setting DATABASE_SSL=false.
  databaseSsl: (process.env.DATABASE_SSL || 'true').toLowerCase() !== 'false',
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_key',
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
