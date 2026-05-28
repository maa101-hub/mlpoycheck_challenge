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

// Public registration (no auth required)
router.post('/register', simulateDelay(1000), UserController.create as any);

export default router;
