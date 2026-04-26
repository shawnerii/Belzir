import { Router } from 'express';
import { validateBody } from '../middleware/validateBody';
import {
  getSettingsHandler,
  updateAuthSettingsHandler,
  updateMfaSettingsHandler,
} from '../modules/settings/settings.controller';
import {
  updateAuthSettingsSchema,
  updateMfaSettingsSchema,
} from '../modules/settings/settings.schemas';

const router = Router();

router.get('/', getSettingsHandler);
router.patch('/auth', validateBody(updateAuthSettingsSchema), updateAuthSettingsHandler);
router.patch('/mfa', validateBody(updateMfaSettingsSchema), updateMfaSettingsHandler);

export default router;
