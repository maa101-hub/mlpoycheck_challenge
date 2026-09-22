import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { connectDatabase } from './config/database';
import routes from './routes';

const app = express();

// Baseline security headers.
app.use(helmet());

// Middleware
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Behind Render's proxy — needed so rate-limit sees the real client IP.
app.set('trust proxy', 1);

// General API rate limit.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Stricter limit for auth endpoints (brute-force / spam protection).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please wait a few minutes and try again.' },
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Mploycheck API running.', timestamp: new Date().toISOString() });
});

// Auth endpoints get the stricter limiter; everything else the general one.
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api', apiLimiter);

// API routes
app.use('/api', routes);

// 404
app.use((_req, res) => { res.status(404).json({ success: false, message: 'Endpoint not found.' }); });

// Central error handler — normalises unexpected errors to a clean JSON 500.
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err?.message || err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// Start
const startServer = async (): Promise<void> => {
  await connectDatabase();
  const server = app.listen(config.port, () => {
    console.log(`\n🚀 Mploycheck API running on http://localhost:${config.port}/api\n`);
  });

  // Graceful shutdown on Render deploys/restarts.
  const shutdown = (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(() => process.exit(0));
    // Force-exit if connections don't drain in time.
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch(err => { console.error('Failed to start:', err); process.exit(1); });

export default app;
