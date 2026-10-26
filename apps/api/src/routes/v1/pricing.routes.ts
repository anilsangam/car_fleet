import { Router } from 'express';
import { AdminPricingController } from '../../controllers/adminPricing.controller';
import { requireAdminAuth } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { fareRuleCreateSchema, fareRuleUpdateSchema } from '@car-rental/shared';

const router = Router();

router.use(requireAdminAuth);

router.get('/', AdminPricingController.listRules);
router.post('/', validateRequest({ body: fareRuleCreateSchema }), AdminPricingController.createRule);
router.patch('/:id', validateRequest({ body: fareRuleUpdateSchema }), AdminPricingController.updateRule);
router.delete('/:id', AdminPricingController.deleteRule);

export default router;

