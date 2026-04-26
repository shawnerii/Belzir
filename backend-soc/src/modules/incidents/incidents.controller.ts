import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/errorHandler';
import type {
  CreateIncidentBody,
  CreateIncidentCommentBody,
  LinkIncidentAlertBody,
  ListIncidentsQuery,
  UpdateIncidentBody,
} from './incidents.schemas';
import { incidentParamsSchema } from './incidents.schemas';
import {
  createIncidentCommentService,
  createIncidentService,
  getIncidentByIdService,
  linkAlertToIncidentService,
  listIncidentsService,
  updateIncidentService,
} from './incidents.service';

function resolveCommentAuthor(req: Request, body: CreateIncidentCommentBody): string | undefined {
  const headerValue = req.header('x-analyst-id')?.trim();
  if (headerValue) {
    return headerValue;
  }
  return body.author;
}

export async function listIncidents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as ListIncidentsQuery;
    const result = await listIncidentsService(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getIncidentById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsedParams = incidentParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      throw new AppError(400, 'Invalid incident id', parsedParams.error.flatten());
    }

    const result = await getIncidentByIdService(parsedParams.data.id);
    if (!result) {
      throw new AppError(404, 'Incident not found');
    }

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function createIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body as CreateIncidentBody;
    const result = await createIncidentService(payload);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsedParams = incidentParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      throw new AppError(400, 'Invalid incident id', parsedParams.error.flatten());
    }

    const payload = req.body as UpdateIncidentBody;
    const result = await updateIncidentService(parsedParams.data.id, payload);
    if (!result) {
      throw new AppError(404, 'Incident not found');
    }

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function linkIncidentAlert(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsedParams = incidentParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      throw new AppError(400, 'Invalid incident id', parsedParams.error.flatten());
    }

    const payload = req.body as LinkIncidentAlertBody;
    const result = await linkAlertToIncidentService({
      incidentId: parsedParams.data.id,
      alertId: payload.alert_id,
    });

    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function createIncidentComment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsedParams = incidentParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      throw new AppError(400, 'Invalid incident id', parsedParams.error.flatten());
    }

    const payload = req.body as CreateIncidentCommentBody;
    const result = await createIncidentCommentService({
      incidentId: parsedParams.data.id,
      body: payload.body,
      author: resolveCommentAuthor(req, payload),
    });

    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}
