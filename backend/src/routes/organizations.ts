import { Router } from 'express';
import { validateBody } from '../middleware/validateBody';
import {
  assignUserToOrganizationHandler,
  createOrganizationHandler,
  deleteOrganizationHandler,
  listOrganizationsHandler,
  listOrganizationUsersHandler,
  unassignUserFromOrganizationHandler,
} from '../modules/organizations/organizations.controller';
import {
  assignOrganizationUserSchema,
  createOrganizationSchema,
} from '../modules/organizations/organizations.schemas';

const router = Router();

router.get('/', listOrganizationsHandler);
router.post('/', validateBody(createOrganizationSchema), createOrganizationHandler);
router.delete('/:id', deleteOrganizationHandler);
router.get('/:id/users', listOrganizationUsersHandler);
router.post('/:id/users', validateBody(assignOrganizationUserSchema), assignUserToOrganizationHandler);
router.delete('/:id/users/:userId', unassignUserFromOrganizationHandler);

export default router;
