import { Router } from 'express';
import * as c from '../controllers/activity';
import { protect, requireRole } from '../middleware/auth';

const router = Router();
router.use(protect, requireRole('admin', 'superadmin'));
router.get('/', c.listActivity);

export default router;
