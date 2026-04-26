import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middleware/errorHandler';
import type {
  AssignOrganizationUserInput,
  CreateOrganizationInput,
  ListOrganizationsQueryInput,
  OrganizationIdParamInput,
  OrganizationUserParamInput,
} from './organizations.schemas';
import {
  listOrganizationsQuerySchema,
  organizationIdParamSchema,
  organizationUserParamSchema,
} from './organizations.schemas';
import {
  assignUserToOrganization,
  createOrganization,
  deleteOrganization,
  listOrganizations,
  listUsersForOrganization,
  unassignUserFromOrganization,
} from './organizations.service';

function parseOrganizationId(req: Request): number {
  const parsed = organizationIdParamSchema.safeParse({ id: req.params.id });
  if (!parsed.success) {
    throw new AppError(400, 'Invalid organization id', parsed.error.flatten());
  }
  return (parsed.data as OrganizationIdParamInput).id;
}

function parseOrganizationUserParams(req: Request): { id: number; userId: number } {
  const parsed = organizationUserParamSchema.safeParse({
    id: req.params.id,
    userId: req.params.userId,
  });
  if (!parsed.success) {
    throw new AppError(400, 'Invalid route params', parsed.error.flatten());
  }
  const data = parsed.data as OrganizationUserParamInput;
  return { id: data.id, userId: data.userId };
}

function parseListQuery(req: Request): ListOrganizationsQueryInput {
  const arrayParams = {
    q: Array.isArray(req.query.q),
    limit: Array.isArray(req.query.limit),
    offset: Array.isArray(req.query.offset),
  };

  if (arrayParams.q || arrayParams.limit || arrayParams.offset) {
    throw new AppError(400, 'Invalid query params', {
      message: 'Query parameters must be single values.',
      ...arrayParams,
    });
  }

  const parsed = listOrganizationsQuerySchema.safeParse({
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    limit: typeof req.query.limit === 'string' ? req.query.limit : undefined,
    offset: typeof req.query.offset === 'string' ? req.query.offset : undefined,
  });
  if (!parsed.success) {
    throw new AppError(400, 'Invalid query params', parsed.error.flatten());
  }
  return parsed.data as ListOrganizationsQueryInput;
}

export async function listOrganizationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = parseListQuery(req);
    const organizations = await listOrganizations(query);
    res.json({ organizations });
  } catch (err) {
    next(err);
  }
}

export async function createOrganizationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as CreateOrganizationInput;
    const organization = await createOrganization(input);
    res.status(201).json({ organization });
  } catch (err) {
    next(err);
  }
}

export async function deleteOrganizationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const organizationId = parseOrganizationId(req);
    const deleted = await deleteOrganization(organizationId);
    if (!deleted) {
      throw new AppError(404, 'Organization not found');
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listOrganizationUsersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const organizationId = parseOrganizationId(req);
    const users = await listUsersForOrganization(organizationId);
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function assignUserToOrganizationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const organizationId = parseOrganizationId(req);
    const input = req.body as AssignOrganizationUserInput;
    const result = await assignUserToOrganization(organizationId, input.userId);
    res.status(result.created ? 201 : 200).json({ assignment: result.assignment });
  } catch (err) {
    next(err);
  }
}

export async function unassignUserFromOrganizationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = parseOrganizationUserParams(req);
    await unassignUserFromOrganization(params.id, params.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
