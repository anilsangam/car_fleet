import { Router } from 'express';
import publicRoutes from './public.routes';
import authRoutes from './auth.routes';
import customerRoutes from './customer.routes';
import carRoutes from './car.routes';
import driverRoutes from './driver.routes';
import bookingRoutes from './booking.routes';
import pricingRoutes from './pricing.routes';
import settingsRoutes from './settings.routes';
import reportRoutes from './report.routes';

const router = Router();

router.use('/', publicRoutes);
router.use('/auth', authRoutes);
router.use('/customer', customerRoutes);
router.use('/admin/cars', carRoutes);
router.use('/admin/drivers', driverRoutes);
router.use('/admin/bookings', bookingRoutes);
router.use('/admin/pricing', pricingRoutes);
router.use('/admin/settings', settingsRoutes);
router.use('/admin/reports', reportRoutes);

export default router;

