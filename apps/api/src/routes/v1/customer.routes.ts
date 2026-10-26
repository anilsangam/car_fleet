import { Router } from 'express';
import { CustomerAuthController } from '../../controllers/customerAuth.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { requireCustomerAuth } from '../../middleware/auth.middleware';
import { loginLimiter } from '../../middleware/rateLimit.middleware';
import { customerSignupSchema, customerLoginSchema } from '@car-rental/shared';

const router = Router();

router.post(
  '/signup',
  loginLimiter,
  validateRequest({ body: customerSignupSchema }),
  CustomerAuthController.signup
);

router.post(
  '/login',
  loginLimiter,
  validateRequest({ body: customerLoginSchema }),
  CustomerAuthController.login
);

router.post('/logout', CustomerAuthController.logout);

router.get('/me', requireCustomerAuth, CustomerAuthController.getMe);

router.get('/bookings', requireCustomerAuth, CustomerAuthController.getMyBookings);

export default router;

