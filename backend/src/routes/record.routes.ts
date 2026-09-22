import { Router } from 'express';
import { RecordController } from '../controllers/record.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { simulateDelay } from '../middleware/delay.middleware';

const router = Router();

/**
 * Verification Records Routes
 * Reads require authentication; mutations require an admin role.
 */

// GET /api/records - Fetch records with search, sort, pagination
router.get('/', authenticate, simulateDelay(), RecordController.getAll);

// GET /api/records/summary - Get dashboard summary
router.get('/summary', authenticate, simulateDelay(1000), RecordController.getSummary);

// POST /api/records - Create a new verification record (admin)
router.post('/', authenticate, authorize('admin'), simulateDelay(800), RecordController.create);

// PUT /api/records/:id - Update a record, incl. status changes (admin)
router.put('/:id', authenticate, authorize('admin'), simulateDelay(800), RecordController.update);

// DELETE /api/records/:id - Delete a record (admin)
router.delete('/:id', authenticate, authorize('admin'), simulateDelay(600), RecordController.remove);

export default router;
