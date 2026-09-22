import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { simulateDelay } from '../middleware/delay.middleware';

const router = Router();

// Employee (self) routes
router.get('/', authenticate, simulateDelay(600), DocumentController.getMyDocuments);
router.get('/progress', authenticate, simulateDelay(800), DocumentController.getProgress);
router.post('/upload', authenticate, simulateDelay(1500), DocumentController.upload);
router.get('/report', authenticate, simulateDelay(1000), DocumentController.getFinalReport);

// Admin review routes (company-scoped). Static paths are declared before the
// parameterised '/:id/...' routes so they aren't shadowed.
router.get('/review', authenticate, authorize('admin'), simulateDelay(700), DocumentController.getReviewList);
router.post('/verify-employee/:userId', authenticate, authorize('admin'), simulateDelay(800), DocumentController.verifyEmployee);
router.post('/:id/verify', authenticate, authorize('admin'), simulateDelay(600), DocumentController.verifyDocument);
router.post('/:id/reject', authenticate, authorize('admin'), simulateDelay(600), DocumentController.rejectDocument);

export default router;
