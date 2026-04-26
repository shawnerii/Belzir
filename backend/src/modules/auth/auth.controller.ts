import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middleware/errorHandler';
import { verifyCredentials, issueToken, findActiveUserById } from './auth.service';
import type { LoginInput } from './auth.schemas';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { usernameOrEmail, password } = req.body as LoginInput;
    const user = await verifyCredentials(usernameOrEmail, password);
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }
    const { token, expiresIn } = issueToken(user);
    res.json({
      token,
      tokenType: 'Bearer',
      expiresIn,
      user,
    });
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response): void {
  // Stateless JWT — no server-side revocation. Acknowledge and return.
  res.status(204).send();
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized');
    }
    const user = await findActiveUserById(req.user.id);
    if (!user) {
      // Token valid but account was deleted or deactivated after issuance.
      throw new AppError(401, 'Unauthorized');
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
