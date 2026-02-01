import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Request validation middleware factory
 *
 * Creates a middleware that validates request body against a Zod schema.
 * If validation fails, it passes the error to the next middleware (error handler).
 *
 * @param schema The Zod schema to validate against
 * @returns Express middleware function
 */
export const validateRequest = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Request body schemas for validation
 */
export const createEntryBodySchema = z.object({
  date: z
    .string({
      required_error: 'Date is required',
      invalid_type_error: 'Date must be a string',
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'Date must be in YYYY-MM-DD format',
    })
    .refine(
      (date) => {
        const [year, month, day] = date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        return (
          dateObj.getFullYear() === year &&
          dateObj.getMonth() === month - 1 &&
          dateObj.getDate() === day
        );
      },
      {
        message: 'Invalid date',
      }
    ),
  content: z
    .string({
      required_error: 'Content is required',
      invalid_type_error: 'Content must be a string',
    })
    .min(1, { message: 'Content must not be empty' })
    .refine((content) => content.trim().length > 0, {
      message: 'Content must not be only whitespace',
    }),
});

export const updateEntryBodySchema = createEntryBodySchema;
