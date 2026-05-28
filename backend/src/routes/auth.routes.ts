import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { simulateDelay } from '../middleware/delay.middleware';

const router = Router();

/**
 * Authentication Routes
 * POST /api/login - User login with async delay simulation
 */
router.post('/login', simulateDelay(800), AuthController.login);

export default router;
