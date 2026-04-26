import { Router } from 'express';
import { validateBody } from '../middleware/validateBody';
import { authenticate } from '../middleware/authenticate';
import { loginSchema } from '../modules/auth/auth.schemas';
import { login, logout, me } from '../modules/auth/auth.controller';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
