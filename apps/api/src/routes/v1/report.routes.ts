import { Router } from 'express';
import { AdminReportController } from '../../controllers/adminReport.controller';
import { requireAdminAuth } from '../../middleware/auth.middleware';

const router = Router();

router.use(requireAdminAuth);

router.get('/metrics', AdminReportController.getMetrics);
router.get('/export-csv', AdminReportController.exportCsv);

export default router;

