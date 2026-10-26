import { Router } from 'express';
import { PublicController } from '../../controllers/public.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { requireCustomerAuth } from '../../middleware/auth.middleware';
import {
  bookingCreateLimiter,
  statusLookupLimiter,
} from '../../middleware/rateLimit.middleware';
import {
  availabilityQuerySchema,
  bookingCreateSchema,
  fareEstimateSchema,
  statusLookupSchema,
} from '@car-rental/shared';

const router = Router();

router.get('/settings', PublicController.getSettings);
router.get('/cars', PublicController.getCars);
router.get('/cars/:id', PublicController.getCarDetails);
router.get('/cars/:id/alternatives', PublicController.getCarAlternatives);
router.get(
  '/availability',
  validateRequest({ query: availabilityQuerySchema }),
  PublicController.checkAvailability
);
router.post(
  '/estimate',
  validateRequest({ body: fareEstimateSchema }),
  PublicController.getFareEstimate
);
router.post(
  '/bookings',
  requireCustomerAuth,
  bookingCreateLimiter,
  validateRequest({ body: bookingCreateSchema }),
  PublicController.createBooking
);
router.post(
  '/bookings/status',
  statusLookupLimiter,
  validateRequest({ body: statusLookupSchema }),
  PublicController.lookupStatus
);

export default router;

