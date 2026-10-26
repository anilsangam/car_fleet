import { Router } from 'express';
import { AdminCarController } from '../../controllers/adminCar.controller';
import { requireAdminAuth } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { carCreateSchema, carUpdateSchema } from '@car-rental/shared';

const router = Router();

router.use(requireAdminAuth);

router.get('/', AdminCarController.listCars);
router.get('/:id', AdminCarController.getCar);
router.post('/', validateRequest({ body: carCreateSchema }), AdminCarController.createCar);
router.patch('/:id', validateRequest({ body: carUpdateSchema }), AdminCarController.updateCar);
router.get('/:id/upcoming-bookings', AdminCarController.getUpcomingBookings);

export default router;

