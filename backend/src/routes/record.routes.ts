import { Router } from 'express';
import { RecordController } from '../controllers/record.controller';
import { authenticate } from '../middleware/auth.middleware';
import { simulateDelay } from '../middleware/delay.middleware';

const router = Router();

/**
 * Verification Records Routes
 * All routes require authentication
 */

// GET /api/records - Fetch records with search, sort, pagination
router.get('/', authenticate, simulateDelay(), RecordController.getAll);

// GET /api/records/summary - Get dashboard summary
router.get('/summary', authenticate, simulateDelay(1000), RecordController.getSummary);

export default router;
