import { Request, Response, NextFunction } from 'express';
import {
  validateRequest,
  createEntryBodySchema,
  updateEntryBodySchema,
} from '../../src/middlewares/validateRequest';
import { ZodError } from 'zod';

describe('validateRequest middleware', () => {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('with createEntryBodySchema', () => {
    const middleware = validateRequest(createEntryBodySchema);

    it('calls next() for valid request body', () => {
      mockRequest.body = { date: '2026-01-31', content: 'Test content' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('calls next with ZodError for empty content', () => {
      mockRequest.body = { date: '2026-01-31', content: '' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it('calls next with ZodError for missing date', () => {
      mockRequest.body = { content: 'Test content' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it('calls next with ZodError for missing content', () => {
      mockRequest.body = { date: '2026-01-31' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it('calls next with ZodError for invalid date format', () => {
      mockRequest.body = { date: 'invalid-date', content: 'Test content' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it('calls next with ZodError for whitespace-only content', () => {
      mockRequest.body = { date: '2026-01-31', content: '   ' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it('calls next with ZodError for invalid date (Feb 30th)', () => {
      mockRequest.body = { date: '2026-02-30', content: 'Test content' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it('accepts Feb 29th on leap year', () => {
      mockRequest.body = { date: '2024-02-29', content: 'Leap year entry' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('rejects Feb 29th on non-leap year', () => {
      mockRequest.body = { date: '2026-02-29', content: 'Test content' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it('accepts date with wrong type and reports type error', () => {
      mockRequest.body = { date: 12345, content: 'Test content' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it('accepts content with wrong type and reports type error', () => {
      mockRequest.body = { date: '2026-01-31', content: 12345 };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });
  });

  describe('with updateEntryBodySchema', () => {
    const middleware = validateRequest(updateEntryBodySchema);

    it('calls next() for valid request body', () => {
      mockRequest.body = { date: '2026-01-31', content: 'Updated content' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('calls next with ZodError for invalid body', () => {
      mockRequest.body = { date: '2026-01-31', content: '' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });
  });
});
