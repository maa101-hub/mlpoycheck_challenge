import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import recordRoutes from './record.routes';
import documentRoutes from './document.routes';
import accessRequestRoutes from './access-request.routes';
import requiredDocumentRoutes from './required-document.routes';
import companyRoutes from './company.routes';

const router = Router();

router.use('/', authRoutes);
router.use('/users', userRoutes);
router.use('/records', recordRoutes);
router.use('/documents', documentRoutes);
router.use('/access-requests', accessRequestRoutes);
router.use('/required-documents', requiredDocumentRoutes);
router.use('/company', companyRoutes);

export default router;
