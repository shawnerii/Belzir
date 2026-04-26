import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { requireJwtSecret } from '../config/env';
import { AppError } from './errorHandler';
import { findActiveUserById } from '../modules/auth/auth.service';

function readUserId(payload: string | JwtPayload): number | null {
  if (typeof payload === 'string') {
    return null;
  }

  const id = payload.id;
  return typeof id === 'number' && Number.isFinite(id) ? id : null;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Unauthorized'));
  }

  const token = header.slice(7);
  try {
    const secret = requireJwtSecret();
    const payload = jwt.verify(token, secret);
    const userId = readUserId(payload);
    if (userId === null) {
      return next(new AppError(401, 'Unauthorized'));
    }

    const activeUser = await findActiveUserById(userId);
    if (!activeUser) {
      return next(new AppError(401, 'Unauthorized'));
    }

    // Authorization must use current DB role/email, not stale token claims.
    req.user = { id: activeUser.id, email: activeUser.email, role: activeUser.role };
    next();
  } catch {
    next(new AppError(401, 'Unauthorized'));
  }
}
