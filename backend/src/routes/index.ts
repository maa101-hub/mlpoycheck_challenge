import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import recordRoutes from './record.routes';
import documentRoutes from './document.routes';
import { UserController } from '../controllers/user.controller';
import { simulateDelay } from '../middleware/delay.middleware';

const router = Router();

router.use('/', authRoutes);
router.use('/users', userRoutes);
router.use('/records', recordRoutes);
router.use('/documents', documentRoutes);

// Public registration (no auth required). Uses the dedicated register handler,
// which forces role='general' so callers cannot self-register as admin.
router.post('/register', simulateDelay(1000), UserController.register);

export default router;
