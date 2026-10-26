import { Router } from 'express';
import { AdminSettingsController } from '../../controllers/adminSettings.controller';
import { requireAdminAuth } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { businessSettingsSchema } from '@car-rental/shared';

const router = Router();

router.use(requireAdminAuth);

router.get('/', AdminSettingsController.getSettings);
router.put('/', validateRequest({ body: businessSettingsSchema }), AdminSettingsController.updateSettings);

export default router;

