import { Router } from 'express';
import { validateBody } from '../middleware/validateBody';
import { validateQuery } from '../middleware/validateQuery';
import {
  createIncident,
  createIncidentComment,
  getIncidentById,
  linkIncidentAlert,
  listIncidents,
  updateIncident,
} from '../modules/incidents/incidents.controller';
import {
  createIncidentBodySchema,
  createIncidentCommentBodySchema,
  linkIncidentAlertBodySchema,
  listIncidentsQuerySchema,
  updateIncidentBodySchema,
} from '../modules/incidents/incidents.schemas';

const router = Router();

router.get('/', validateQuery(listIncidentsQuerySchema), listIncidents);
router.get('/:id', getIncidentById);
router.post('/', validateBody(createIncidentBodySchema), createIncident);
router.patch('/:id', validateBody(updateIncidentBodySchema), updateIncident);
router.post('/:id/alerts', validateBody(linkIncidentAlertBodySchema), linkIncidentAlert);
router.post('/:id/comments', validateBody(createIncidentCommentBodySchema), createIncidentComment);

export default router;
