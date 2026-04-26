import { Router } from 'express';
import { validateBody } from '../middleware/validateBody';
import { createTriageDecisionBodySchema } from '../modules/triage/triage.schemas';
import { createTriageDecision } from '../modules/triage/triage.controller';

const router = Router();

router.post('/alerts/:id/decisions', validateBody(createTriageDecisionBodySchema), createTriageDecision);

export default router;
