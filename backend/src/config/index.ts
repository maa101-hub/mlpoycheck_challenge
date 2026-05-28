import dotenv from 'dotenv';

dotenv.config();

/**
 * Application configuration
 * Centralizes all environment variables and defaults
 */
export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mploycheck',
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  // Simulated API delay in milliseconds for async processing demo
  apiDelay: parseInt(process.env.API_DELAY || '1500', 10),
};
