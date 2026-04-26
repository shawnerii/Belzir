import { Router } from 'express';
import alertsRouter from './alerts';
import incidentsRouter from './incidents';
import triageRouter from './triage';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/alerts', alertsRouter);
router.use('/triage', triageRouter);
router.use('/incidents', incidentsRouter);

export default router;
