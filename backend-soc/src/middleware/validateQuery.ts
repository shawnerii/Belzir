import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { AppError } from './errorHandler';

export function validateQuery<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(new AppError(400, 'Invalid query params', result.error.flatten()));
    }
    req.query = result.data as z.infer<T>;
    next();
  };
}
