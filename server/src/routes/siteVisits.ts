import { Router } from 'express';
import * as c from '../controllers/siteVisits';
import { validate } from '../middleware/validate';
import { createVisitSchema, updateVisitSchema } from '../validators';
import { protect, requireRole } from '../middleware/auth';

const router = Router();

router.use(protect, requireRole('admin', 'superadmin'));
router.get('/', c.listVisits);
router.post('/', validate(createVisitSchema), c.createVisit);
router.get('/:id', c.getVisit);
router.patch('/:id', validate(updateVisitSchema), c.updateVisit);
router.delete('/:id', c.deleteVisit);

export default router;
