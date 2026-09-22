import { Router } from 'express';
import { AccessRequestController } from '../controllers/access-request.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { simulateDelay } from '../middleware/delay.middleware';

const router = Router();

// All access-request management is admin-only and scoped to the admin's company.
router.get('/', authenticate, authorize('admin'), simulateDelay(600), AccessRequestController.list);
router.post('/:id/approve', authenticate, authorize('admin'), simulateDelay(600), AccessRequestController.approve);
router.post('/:id/reject', authenticate, authorize('admin'), simulateDelay(600), AccessRequestController.reject);

export default router;
