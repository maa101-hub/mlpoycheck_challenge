import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { simulateDelay } from '../middleware/delay.middleware';

const router = Router();

router.get('/', authenticate, simulateDelay(600), DocumentController.getMyDocuments);
router.get('/progress', authenticate, simulateDelay(800), DocumentController.getProgress);
router.post('/upload', authenticate, simulateDelay(1500), DocumentController.upload);
router.get('/report', authenticate, simulateDelay(1000), DocumentController.getFinalReport);

export default router;
