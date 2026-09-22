import { Router } from 'express';
import * as c from '../controllers/media';
import { protect, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(protect, requireRole('admin', 'superadmin'));
router.post('/upload', upload.array('files', 10), c.uploadMedia);
router.get('/', c.listMedia);
router.patch('/:id', c.updateMedia);
router.delete('/:id', c.deleteMedia);

export default router;
