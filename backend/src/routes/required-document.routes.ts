import { Router } from 'express';
import { RequiredDocumentController } from '../controllers/required-document.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { simulateDelay } from '../middleware/delay.middleware';

const router = Router();

// Any authenticated member can read their company's required documents.
router.get('/', authenticate, simulateDelay(500), RequiredDocumentController.list);

// Only admins can change the list (scoped to their own company).
router.post('/', authenticate, authorize('admin'), simulateDelay(600), RequiredDocumentController.add);
router.delete('/:docType', authenticate, authorize('admin'), simulateDelay(600), RequiredDocumentController.remove);

export default router;
