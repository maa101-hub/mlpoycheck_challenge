import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { simulateDelay } from '../middleware/delay.middleware';

const router = Router();

router.get('/', authenticate, simulateDelay(800), UserController.getAll);
router.get('/:id', authenticate, simulateDelay(500), UserController.getById);
router.post('/', authenticate, authorize('admin'), simulateDelay(1000), UserController.create);
router.put('/:id', authenticate, authorize('admin'), simulateDelay(800), UserController.update);
router.delete('/:id', authenticate, authorize('admin'), simulateDelay(600), UserController.delete);

export default router;
