import { Router } from 'express';
import * as c from '../controllers/dashboard';
import { protect, requireRole } from '../middleware/auth';

const router = Router();
router.use(protect, requireRole('admin', 'superadmin'));
router.get('/stats', c.dashboardStats);

export default router;
