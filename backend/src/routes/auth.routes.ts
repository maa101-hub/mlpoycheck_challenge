import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { simulateDelay } from '../middleware/delay.middleware';

const router = Router();

/**
 * Authentication Routes
 * POST /api/login - User login with async delay simulation
 */
router.post('/login', simulateDelay(800), AuthController.login);

// Public registration — mode 'company' (create + become admin) or 'join'
// (request access to an existing company via its join code).
router.post('/register', simulateDelay(1000), AuthController.register);

export default router;
