import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/errorHandler';
import type { CreateTriageDecisionBody } from './triage.schemas';
import { triageAlertParamsSchema } from './triage.schemas';
import { createTriageDecisionService } from './triage.service';

function resolveDecidedBy(req: Request, body: CreateTriageDecisionBody): string | undefined {
  const headerValue = req.header('x-analyst-id')?.trim();
  if (headerValue) {
    return headerValue;
  }

  return body.decided_by;
}

export async function createTriageDecision(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsedParams = triageAlertParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      throw new AppError(400, 'Invalid alert id', parsedParams.error.flatten());
    }

    const payload = req.body as CreateTriageDecisionBody;
    const result = await createTriageDecisionService({
      alertId: parsedParams.data.id,
      decision: payload.decision,
      note: payload.note,
      decidedBy: resolveDecidedBy(req, payload),
    });

    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}
