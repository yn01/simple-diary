import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssueCode } from 'zod';
import { errorHandler, ApiError } from '../../src/middlewares/errorHandler';

describe('errorHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    // Suppress console.error during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('ZodError handling', () => {
    it('handles ZodError and returns 400 with validation details', () => {
      const zodError = new ZodError([
        {
          code: ZodIssueCode.too_small,
          minimum: 1,
          type: 'string',
          inclusive: true,
          exact: false,
          message: 'Content must not be empty',
          path: ['content'],
        },
      ]);

      errorHandler(zodError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Validation Error',
        details: ["'content': Content must not be empty"],
      });
    });

    it('handles ZodError with multiple errors', () => {
      const zodError = new ZodError([
        {
          code: ZodIssueCode.too_small,
          minimum: 1,
          type: 'string',
          inclusive: true,
          exact: false,
          message: 'Content must not be empty',
          path: ['content'],
        },
        {
          code: ZodIssueCode.invalid_string,
          validation: 'regex',
          message: 'Date must be in YYYY-MM-DD format',
          path: ['date'],
        },
      ]);

      errorHandler(zodError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.details).toHaveLength(2);
    });

    it('handles ZodError with empty path', () => {
      const zodError = new ZodError([
        {
          code: ZodIssueCode.custom,
          message: 'Invalid input',
          path: [],
        },
      ]);

      errorHandler(zodError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Validation Error',
        details: ['Invalid input'],
      });
    });
  });

  describe('ApiError handling', () => {
    it('handles ApiError and returns correct status code', () => {
      const apiError = new ApiError(404, 'Entry not found');

      errorHandler(apiError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Entry not found',
      });
    });

    it('handles ApiError with details', () => {
      const apiError = new ApiError(400, 'Validation Error', [
        'Field 1 is invalid',
        'Field 2 is required',
      ]);

      errorHandler(apiError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Validation Error',
        details: ['Field 1 is invalid', 'Field 2 is required'],
      });
    });
  });

  describe('Unknown error handling', () => {
    it('handles unknown errors and returns 500', () => {
      const unknownError = new Error('Something went wrong');

      errorHandler(unknownError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal Server Error',
      });
    });

    it('does not expose error details for unknown errors', () => {
      const unknownError = new Error('Database connection failed: password=secret123');

      errorHandler(unknownError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.message).toBe('Internal Server Error');
      expect(jsonCall.details).toBeUndefined();
    });
  });

  describe('Logging', () => {
    it('logs errors to console', () => {
      const error = new Error('Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(console.error).toHaveBeenCalledWith('Error:', error);
    });
  });
});
