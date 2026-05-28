import express from 'express';
import cors from 'cors';
import { config } from './config';
import { connectDatabase } from './config/database';
import routes from './routes';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:4201'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Mploycheck API running.', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// 404
app.use((_req, res) => { res.status(404).json({ success: false, message: 'Endpoint not found.' }); });

// Start
const startServer = async (): Promise<void> => {
  await connectDatabase();
  app.listen(config.port, () => {
    console.log(`\n🚀 Mploycheck API running on http://localhost:${config.port}/api\n`);
  });
};

startServer().catch(err => { console.error('Failed to start:', err); process.exit(1); });

export default app;
