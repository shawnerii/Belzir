import { Router } from 'express';
import { validateBody } from '../middleware/validateBody';
import {
  activateUserHandler,
  createUserHandler,
  deactivateUserHandler,
  deleteUserHandler,
  getUserByIdHandler,
  listUsersHandler,
  resetUserPasswordHandler,
  updateUserHandler,
} from '../modules/users/users.controller';
import { createUserSchema, updateUserSchema } from '../modules/users/users.schemas';

const router = Router();

router.get('/', listUsersHandler);
router.get('/:id', getUserByIdHandler);
router.post('/', validateBody(createUserSchema), createUserHandler);
router.patch('/:id', validateBody(updateUserSchema), updateUserHandler);
router.delete('/:id', deleteUserHandler);
router.post('/:id/activate', activateUserHandler);
router.post('/:id/deactivate', deactivateUserHandler);
router.post('/:id/reset-password', resetUserPasswordHandler);

export default router;
