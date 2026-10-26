import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

export const validateRequest = (schema: {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = (await schema.query.parseAsync(req.query)) as any;
      }
      if (schema.params) {
        req.params = (await schema.params.parseAsync(req.params)) as any;
      }
      next();
    } catch (error: any) {
      if (error instanceof ZodError || error?.name === 'ZodError' || Array.isArray(error?.issues)) {
        const formattedErrors: Record<string, string> = {};
        const issues = error.errors || error.issues || [];
        issues.forEach((err: any) => {
          const path = (err.path && err.path.join('.')) || 'root';
          if (!formattedErrors[path]) {
            formattedErrors[path] = err.message;
          }
        });

        return res.status(400).json({
          success: false,
          message: 'Please correct the highlighted fields.',
          error: 'Please correct the highlighted fields.',
          errors: formattedErrors,
        });
      }
      next(error);
    }
  };
};
