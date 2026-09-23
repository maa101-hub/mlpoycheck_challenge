import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { authenticate } from '../middleware/auth.middleware';
import { simulateDelay } from '../middleware/delay.middleware';

const router = Router();

// Any authenticated member can read their own company's info + admin contacts.
router.get('/me', authenticate, simulateDelay(400), CompanyController.myCompany);

export default router;
