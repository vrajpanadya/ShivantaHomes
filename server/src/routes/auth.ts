import { Router } from 'express';
import * as c from '../controllers/auth';
import { validate } from '../middleware/validate';
import { loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, profileSchema } from '../validators';
import { protect } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), c.login);
router.post('/logout', c.logout);
router.get('/me', protect, c.me);
router.post('/change-password', protect, validate(changePasswordSchema), c.changePassword);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), c.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), c.resetPassword);
router.put('/profile', protect, validate(profileSchema), c.updateProfile);

export default router;
