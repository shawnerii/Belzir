import { Router } from 'express';
import { getAlertById, listAlerts } from '../modules/alerts/alerts.controller';
import { listAlertsQuerySchema } from '../modules/alerts/alerts.schemas';
import { validateQuery } from '../middleware/validateQuery';

const router = Router();

router.get('/', validateQuery(listAlertsQuerySchema), listAlerts);
router.get('/:id', getAlertById);

export default router;
