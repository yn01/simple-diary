import { Request, Response, NextFunction } from 'express';
import { EntryController } from '../../src/controllers/EntryController';
import { EntryService } from '../../src/services/EntryService';
import { Entry } from '../../src/models/Entry';
import { ZodError } from 'zod';

// Mock EntryService
jest.mock('../../src/services/EntryService');

describe('EntryController', () => {
  let controller: EntryController;
  let mockService: jest.Mocked<EntryService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  const mockEntry: Entry = {
    id: 1,
    date: '2026-01-31',
    content: 'Test content',
    created_at: '2026-01-31T12:00:00.000Z',
    updated_at: '2026-01-31T12:00:00.000Z',
  };

  beforeEach(() => {
    mockService = new EntryService(null as any) as jest.Mocked<EntryService>;
    controller = new EntryController(mockService);

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

  describe('create', () => {
    it('creates entry and returns 201 status', async () => {
      mockRequest.body = { date: '2026-01-31', content: 'Test content' };
      mockService.createEntry = jest.fn().mockReturnValue(mockEntry);

      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.createEntry).toHaveBeenCalledWith({
        date: '2026-01-31',
        content: 'Test content',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockEntry);
    });

    it('calls next with error on validation failure', async () => {
      mockRequest.body = { date: '2026-01-31', content: '' };
      const validationError = new ZodError([]);
      mockService.createEntry = jest.fn().mockImplementation(() => {
        throw validationError;
      });

      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it('calls next with error on service error', async () => {
      mockRequest.body = { date: '2026-01-31', content: 'Test content' };
      const error = new Error('Service error');
      mockService.createEntry = jest.fn().mockImplementation(() => {
        throw error;
      });

      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getAll', () => {
    it('returns all entries with 200 status', async () => {
      const entries = [mockEntry, { ...mockEntry, id: 2 }];
      mockService.getAllEntries = jest.fn().mockReturnValue(entries);

      await controller.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.getAllEntries).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(entries);
    });

    it('returns empty array when no entries exist', async () => {
      mockService.getAllEntries = jest.fn().mockReturnValue([]);

      await controller.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it('calls next with error on service error', async () => {
      const error = new Error('Service error');
      mockService.getAllEntries = jest.fn().mockImplementation(() => {
        throw error;
      });

      await controller.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getById', () => {
    it('returns entry with 200 status when found', async () => {
      mockRequest.params = { id: '1' };
      mockService.getEntryById = jest.fn().mockReturnValue(mockEntry);

      await controller.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.getEntryById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockEntry);
    });

    it('returns 404 when entry not found', async () => {
      mockRequest.params = { id: '999' };
      mockService.getEntryById = jest.fn().mockReturnValue(null);

      await controller.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Entry not found',
      });
    });

    it('returns 400 for invalid id format', async () => {
      mockRequest.params = { id: 'invalid' };

      await controller.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid ID format',
      });
    });

    it('returns 400 for negative id', async () => {
      mockRequest.params = { id: '-1' };

      await controller.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid ID format',
      });
    });

    it('calls next with error on service error', async () => {
      mockRequest.params = { id: '1' };
      const error = new Error('Service error');
      mockService.getEntryById = jest.fn().mockImplementation(() => {
        throw error;
      });

      await controller.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    it('updates entry and returns 200 status', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { date: '2026-01-31', content: 'Updated content' };
      const updatedEntry = { ...mockEntry, content: 'Updated content' };
      mockService.updateEntry = jest.fn().mockReturnValue(updatedEntry);

      await controller.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.updateEntry).toHaveBeenCalledWith(1, {
        date: '2026-01-31',
        content: 'Updated content',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedEntry);
    });

    it('returns 404 when entry not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { date: '2026-01-31', content: 'Updated content' };
      mockService.updateEntry = jest.fn().mockReturnValue(null);

      await controller.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Entry not found',
      });
    });

    it('returns 400 for invalid id format', async () => {
      mockRequest.params = { id: 'invalid' };
      mockRequest.body = { date: '2026-01-31', content: 'Updated content' };

      await controller.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid ID format',
      });
    });

    it('calls next with error on validation failure', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { date: '2026-01-31', content: '' };
      const validationError = new ZodError([]);
      mockService.updateEntry = jest.fn().mockImplementation(() => {
        throw validationError;
      });

      await controller.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe('delete', () => {
    it('deletes entry and returns 204 status', async () => {
      mockRequest.params = { id: '1' };
      mockService.deleteEntry = jest.fn().mockReturnValue(true);
      mockResponse.send = jest.fn().mockReturnThis();

      await controller.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.deleteEntry).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('returns 404 when entry not found', async () => {
      mockRequest.params = { id: '999' };
      mockService.deleteEntry = jest.fn().mockReturnValue(false);

      await controller.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Entry not found',
      });
    });

    it('returns 400 for invalid id format', async () => {
      mockRequest.params = { id: 'invalid' };

      await controller.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid ID format',
      });
    });

    it('calls next with error on service error', async () => {
      mockRequest.params = { id: '1' };
      const error = new Error('Service error');
      mockService.deleteEntry = jest.fn().mockImplementation(() => {
        throw error;
      });

      await controller.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('search', () => {
    it('returns matching entries with 200 status', async () => {
      mockRequest.query = { q: 'test' };
      const entries = [mockEntry];
      mockService.searchEntries = jest.fn().mockReturnValue(entries);

      await controller.search(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.searchEntries).toHaveBeenCalledWith('test');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(entries);
    });

    it('returns empty array when no matches found', async () => {
      mockRequest.query = { q: 'nonexistent' };
      mockService.searchEntries = jest.fn().mockReturnValue([]);

      await controller.search(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it('returns 400 when query parameter is missing', async () => {
      mockRequest.query = {};

      await controller.search(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Validation Error',
        details: ["'q' parameter is required for search."],
      });
    });

    it('returns all entries for empty query string', async () => {
      mockRequest.query = { q: '' };
      const entries = [mockEntry];
      mockService.searchEntries = jest.fn().mockReturnValue(entries);

      await controller.search(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.searchEntries).toHaveBeenCalledWith('');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('calls next with error on service error', async () => {
      mockRequest.query = { q: 'test' };
      const error = new Error('Service error');
      mockService.searchEntries = jest.fn().mockImplementation(() => {
        throw error;
      });

      await controller.search(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
