import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Error response interface
 */
export interface ErrorResponse {
  message: string;
  details?: string[];
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public statusCode: number;
  public details?: string[];

  constructor(statusCode: number, message: string, details?: string[]) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Global error handler middleware
 *
 * Handles all errors thrown in the application and returns
 * appropriate HTTP responses with error details.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error for debugging (in production, use a proper logger)
  console.error('Error:', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => {
      const path = e.path.join('.');
      return path ? `'${path}': ${e.message}` : e.message;
    });

    const response: ErrorResponse = {
      message: 'Validation Error',
      details,
    };

    res.status(400).json(response);
    return;
  }

  // Handle custom API errors
  if (err instanceof ApiError) {
    const response: ErrorResponse = {
      message: err.message,
    };
    if (err.details) {
      response.details = err.details;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle unknown errors (don't expose internal details in production)
  const response: ErrorResponse = {
    message: 'Internal Server Error',
  };

  res.status(500).json(response);
};
