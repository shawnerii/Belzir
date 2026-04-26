import type { NextFunction, Request, Response } from 'express';
import type { UpdateAuthSettingsInput, UpdateMfaSettingsInput } from './settings.schemas';
import { getSettings, updateAuthSettings, updateMfaSettings } from './settings.service';

export async function getSettingsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const settings = await getSettings();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

export async function updateAuthSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patch = req.body as UpdateAuthSettingsInput;
    const settings = await updateAuthSettings(patch);
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

export async function updateMfaSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patch = req.body as UpdateMfaSettingsInput;
    const settings = await updateMfaSettings(patch);
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}
