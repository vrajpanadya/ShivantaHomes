import { Router } from 'express';
import * as c from '../controllers/enquiries';
import { validate } from '../middleware/validate';
import { createEnquirySchema, updateEnquirySchema, noteSchema } from '../validators';
import { protect, requireRole } from '../middleware/auth';
import { enquiryLimiter } from '../middleware/rateLimit';

const router = Router();

// Public submission
router.post('/', enquiryLimiter, validate(createEnquirySchema), c.createEnquiry);

// Admin management
router.use(protect, requireRole('admin', 'superadmin'));
router.get('/', c.listEnquiries);
router.get('/export', c.exportCsv);
router.get('/:id', c.getEnquiry);
router.patch('/:id', validate(updateEnquirySchema), c.updateEnquiry);
router.post('/:id/notes', validate(noteSchema), c.addNote);
router.delete('/:id', c.deleteEnquiry);

export default router;
