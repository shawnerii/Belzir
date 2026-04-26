import { Router } from 'express';
import { validateBody } from '../middleware/validateBody';
import {
  createInvitationsHandler,
  listInvitationsHandler,
  revokeInvitationHandler,
} from '../modules/invitations/invitations.controller';
import { createInvitationsSchema } from '../modules/invitations/invitations.schemas';

const router = Router();

router.get('/', listInvitationsHandler);
router.post('/', validateBody(createInvitationsSchema), createInvitationsHandler);
router.post('/:id/revoke', revokeInvitationHandler);

export default router;
