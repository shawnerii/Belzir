import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middleware/errorHandler';
import type {
  CreateInvitationsInput,
  InvitationIdParamInput,
  ListInvitationsQueryInput,
} from './invitations.schemas';
import {
  invitationIdParamSchema,
  listInvitationsQuerySchema,
} from './invitations.schemas';
import {
  createInvitations,
  listInvitations,
  revokeInvitation,
} from './invitations.service';

function parseInvitationId(req: Request): number {
  const parsed = invitationIdParamSchema.safeParse({ id: req.params.id });
  if (!parsed.success) {
    throw new AppError(400, 'Invalid invitation id', parsed.error.flatten());
  }
  return (parsed.data as InvitationIdParamInput).id;
}

function parseListQuery(req: Request): ListInvitationsQueryInput {
  const arrayParams = {
    q: Array.isArray(req.query.q),
    organizationId: Array.isArray(req.query.organizationId),
    status: Array.isArray(req.query.status),
    limit: Array.isArray(req.query.limit),
  };

  if (
    arrayParams.q ||
    arrayParams.organizationId ||
    arrayParams.status ||
    arrayParams.limit
  ) {
    throw new AppError(400, 'Invalid query params', {
      message: 'Query parameters must be single values.',
      ...arrayParams,
    });
  }

  const parsed = listInvitationsQuerySchema.safeParse({
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    organizationId: typeof req.query.organizationId === 'string' ? req.query.organizationId : undefined,
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    limit: typeof req.query.limit === 'string' ? req.query.limit : undefined,
  });

  if (!parsed.success) {
    throw new AppError(400, 'Invalid query params', parsed.error.flatten());
  }

  return parsed.data as ListInvitationsQueryInput;
}

function requireActorId(req: Request): number {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }
  return req.user.id;
}

export async function createInvitationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actorId = requireActorId(req);
    const input = req.body as CreateInvitationsInput;
    const result = await createInvitations(actorId, input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listInvitationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = parseListQuery(req);
    const invitations = await listInvitations(query);
    res.json({ invitations });
  } catch (err) {
    next(err);
  }
}

export async function revokeInvitationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const invitationId = parseInvitationId(req);
    const invitation = await revokeInvitation(invitationId);
    if (!invitation) {
      throw new AppError(404, 'Invitation not found');
    }

    res.json({ invitation });
  } catch (err) {
    next(err);
  }
}
