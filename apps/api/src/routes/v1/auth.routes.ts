import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { loginLimiter } from '../../middleware/rateLimit.middleware';
import { requireAdminAuth } from '../../middleware/auth.middleware';
import { adminLoginSchema } from '@car-rental/shared';

const router = Router();

router.post(
  '/login',
  loginLimiter,
  validateRequest({ body: adminLoginSchema }),
  AuthController.login
);
router.post('/logout', AuthController.logout);
router.get('/me', requireAdminAuth, AuthController.getMe);

export default router;

