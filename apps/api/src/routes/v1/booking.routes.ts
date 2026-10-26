import { Router } from 'express';
import { AdminBookingController } from '../../controllers/adminBooking.controller';
import { requireAdminAuth } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import {
  bookingAssignmentSchema,
  bookingStatusUpdateSchema,
  cashCollectionSchema,
} from '@car-rental/shared';

const router = Router();

router.use(requireAdminAuth);

router.get('/', AdminBookingController.listBookings);
router.get('/:id', AdminBookingController.getBookingDetails);
router.post('/:id/accept', AdminBookingController.acceptBooking);
router.post(
  '/:id/assign',
  validateRequest({ body: bookingAssignmentSchema }),
  AdminBookingController.assignResources
);
router.patch(
  '/:id/status',
  validateRequest({ body: bookingStatusUpdateSchema }),
  AdminBookingController.updateStatus
);
router.post(
  '/:id/payment',
  validateRequest({ body: cashCollectionSchema }),
  AdminBookingController.recordCashPayment
);

export default router;

