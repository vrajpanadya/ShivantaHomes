import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from '../utils/ApiError';

export const validate =
  (schema: z.ZodSchema, source: 'body' | 'query' = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      const first = Object.values(fields)[0]?.[0];
      return next(new ApiError(400, first || 'Validation failed', fields));
    }
    (req as unknown as Record<string, unknown>)[source] = result.data;
    next();
  };
