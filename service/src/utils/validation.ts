import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const formattedErrors = (error as z.ZodError).issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }
      next(error);
    }
  };
};

// Common validation schemas
export const usernameSchema = z.string()
  .min(1, 'Username is required')
  .max(39, 'Username cannot be longer than 39 characters')
  .regex(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i, 'Invalid GitHub username format');

export const paginationSchema = z.object({
  page: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().positive().default(1)
  ),
  limit: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().positive().max(100).default(10)
  ),
});

export const repoSearchSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
    sort: z.enum(['stars', 'forks', 'updated']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

export const repoDetailsSchema = z.object({
  params: z.object({
    owner: z.string().min(1, 'Owner is required'),
    repo: z.string().min(1, 'Repository name is required'),
  }),
});
