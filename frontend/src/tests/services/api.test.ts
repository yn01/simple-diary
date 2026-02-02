import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '@/services/api';
import type { Entry, CreateEntryRequest, UpdateEntryRequest } from '@/types/Entry';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('API Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  const mockEntry: Entry = {
    id: 1,
    date: '2026-01-31',
    content: 'Test entry content',
    created_at: '2026-01-31T12:00:00.000Z',
    updated_at: '2026-01-31T12:00:00.000Z',
  };

  describe('getEntries', () => {
    it('fetches all entries successfully', async () => {
      const mockEntries: Entry[] = [mockEntry];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEntries),
      });

      const result = await api.getEntries();

      expect(mockFetch).toHaveBeenCalledWith('/api/entries');
      expect(result).toEqual(mockEntries);
    });

    it('throws error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(api.getEntries()).rejects.toThrow('Failed to fetch entries');
    });
  });

  describe('getEntry', () => {
    it('fetches a single entry by id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEntry),
      });

      const result = await api.getEntry(1);

      expect(mockFetch).toHaveBeenCalledWith('/api/entries/1');
      expect(result).toEqual(mockEntry);
    });

    it('throws error when entry not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(api.getEntry(999)).rejects.toThrow('Entry not found');
    });
  });

  describe('createEntry', () => {
    it('creates a new entry successfully', async () => {
      const createRequest: CreateEntryRequest = {
        date: '2026-01-31',
        content: 'New entry content',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEntry),
      });

      const result = await api.createEntry(createRequest);

      expect(mockFetch).toHaveBeenCalledWith('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createRequest),
      });
      expect(result).toEqual(mockEntry);
    });

    it('throws error on validation failure', async () => {
      const createRequest: CreateEntryRequest = {
        date: '2026-01-31',
        content: '',
      };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            message: 'Validation Error',
            details: ["'content' must not be empty."],
          }),
      });

      await expect(api.createEntry(createRequest)).rejects.toThrow('Failed to create entry');
    });
  });

  describe('updateEntry', () => {
    it('updates an entry successfully', async () => {
      const updateRequest: UpdateEntryRequest = {
        date: '2026-01-31',
        content: 'Updated content',
      };
      const updatedEntry = { ...mockEntry, content: 'Updated content' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedEntry),
      });

      const result = await api.updateEntry(1, updateRequest);

      expect(mockFetch).toHaveBeenCalledWith('/api/entries/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateRequest),
      });
      expect(result).toEqual(updatedEntry);
    });

    it('throws error when entry not found', async () => {
      const updateRequest: UpdateEntryRequest = {
        date: '2026-01-31',
        content: 'Updated content',
      };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(api.updateEntry(999, updateRequest)).rejects.toThrow('Entry not found');
    });
  });

  describe('deleteEntry', () => {
    it('deletes an entry successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await api.deleteEntry(1);

      expect(mockFetch).toHaveBeenCalledWith('/api/entries/1', {
        method: 'DELETE',
      });
    });

    it('throws error when entry not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(api.deleteEntry(999)).rejects.toThrow('Entry not found');
    });
  });

  describe('searchEntries', () => {
    it('searches entries by keyword', async () => {
      const mockEntries: Entry[] = [mockEntry];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEntries),
      });

      const result = await api.searchEntries('test');

      expect(mockFetch).toHaveBeenCalledWith('/api/entries/search?q=test');
      expect(result).toEqual(mockEntries);
    });

    it('encodes search query properly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await api.searchEntries('hello world');

      expect(mockFetch).toHaveBeenCalledWith('/api/entries/search?q=hello%20world');
    });

    it('throws error when query is empty', async () => {
      await expect(api.searchEntries('')).rejects.toThrow('Search query is required');
    });
  });
});
