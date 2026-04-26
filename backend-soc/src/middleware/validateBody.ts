import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { AppError } from './errorHandler';

export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new AppError(400, 'Invalid request body', result.error.flatten()));
    }
    req.body = result.data as z.infer<T>;
    next();
  };
}
