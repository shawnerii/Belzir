import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middleware/errorHandler';
import type {
  CreateUserInput,
  ListUsersQueryInput,
  UpdateUserInput,
  UserIdParamInput,
} from './users.schemas';
import { listUsersQuerySchema, userIdParamSchema } from './users.schemas';
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  resetUserPassword,
  setUserActiveState,
  updateUser,
} from './users.service';

function parseUserId(req: Request): number {
  const parsed = userIdParamSchema.safeParse({ id: req.params.id });
  if (!parsed.success) {
    throw new AppError(400, 'Invalid user id', parsed.error.flatten());
  }
  return (parsed.data as UserIdParamInput).id;
}

function parseListQuery(req: Request): ListUsersQueryInput {
  const arrayParams = {
    q: Array.isArray(req.query.q),
    isActive: Array.isArray(req.query.isActive),
  };

  if (arrayParams.q || arrayParams.isActive) {
    throw new AppError(400, 'Invalid query params', {
      message: 'Query parameters must be single values.',
      ...arrayParams,
    });
  }

  const parsed = listUsersQuerySchema.safeParse({
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    isActive: typeof req.query.isActive === 'string' ? req.query.isActive : undefined,
  });
  if (!parsed.success) {
    throw new AppError(400, 'Invalid query params', parsed.error.flatten());
  }
  return parsed.data as ListUsersQueryInput;
}

function requireActorId(req: Request): number {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }
  return req.user.id;
}

export async function listUsersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = parseListQuery(req);
    const users = await listUsers({
      q: query.q,
      isActive: query.isActive === undefined ? undefined : query.isActive === 'true',
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function getUserByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = parseUserId(req);
    const user = await getUserById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function createUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as CreateUserInput;
    const result = await createUser(input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actorId = requireActorId(req);
    const userId = parseUserId(req);
    const patch = req.body as UpdateUserInput;
    const user = await updateUser(actorId, userId, patch);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function deleteUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actorId = requireActorId(req);
    const userId = parseUserId(req);
    const deleted = await deleteUser(actorId, userId);
    if (!deleted) {
      throw new AppError(404, 'User not found');
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function activateUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actorId = requireActorId(req);
    const userId = parseUserId(req);
    const user = await setUserActiveState(actorId, userId, true);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function deactivateUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actorId = requireActorId(req);
    const userId = parseUserId(req);
    const user = await setUserActiveState(actorId, userId, false);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function resetUserPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actorId = requireActorId(req);
    const userId = parseUserId(req);
    const temporaryPassword = await resetUserPassword(actorId, userId);
    if (!temporaryPassword) {
      throw new AppError(404, 'User not found');
    }
    res.json({ temporaryPassword });
  } catch (err) {
    next(err);
  }
}
