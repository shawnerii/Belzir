import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import authRouter from './auth';
import invitationsRouter from './invitations';
import organizationsRouter from './organizations';
import settingsRouter from './settings';
import usersRouter from './users';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRouter);
router.use('/users', authenticate, requireRole('admin'), usersRouter);
router.use('/invitations', authenticate, requireRole('admin'), invitationsRouter);
router.use('/organizations', authenticate, requireRole('admin'), organizationsRouter);
router.use('/settings', authenticate, requireRole('admin'), settingsRouter);

// Admin-only probe kept for role-middleware regression testing.
router.get('/auth-check', authenticate, requireRole('admin'), (req, res) => {
  res.json({ status: 'ok', user: req.user });
});

export default router;
