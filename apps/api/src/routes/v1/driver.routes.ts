import { Router } from 'express';
import { AdminDriverController } from '../../controllers/adminDriver.controller';
import { requireAdminAuth } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { driverCreateSchema, driverUpdateSchema } from '@car-rental/shared';

const router = Router();

router.use(requireAdminAuth);

router.get('/', AdminDriverController.listDrivers);
router.get('/:id', AdminDriverController.getDriver);
router.post('/', validateRequest({ body: driverCreateSchema }), AdminDriverController.createDriver);
router.patch('/:id', validateRequest({ body: driverUpdateSchema }), AdminDriverController.updateDriver);
router.get('/:id/upcoming-bookings', AdminDriverController.getUpcomingBookings);

export default router;

