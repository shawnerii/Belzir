import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middleware/errorHandler';
import { alertParamsSchema, type ListAlertsQuery } from './alerts.schemas';
import { getAlertByIdService, listAlertsService } from './alerts.service';

export async function listAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as ListAlertsQuery;
    const result = await listAlertsService(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAlertById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsedParams = alertParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      throw new AppError(400, 'Invalid alert id', parsedParams.error.flatten());
    }

    const alert = await getAlertByIdService(parsedParams.data.id);
    if (!alert) {
      throw new AppError(404, 'Alert not found');
    }

    res.json({ data: alert });
  } catch (err) {
    next(err);
  }
}
