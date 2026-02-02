import type { Entry, CreateEntryRequest, UpdateEntryRequest } from '@/types/Entry';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response, errorMessage: string): Promise<T> {
  if (!response.ok) {
    if (response.status === 404) {
      throw new ApiError('Entry not found', 404);
    }
    throw new ApiError(errorMessage, response.status);
  }
  return response.json();
}

export const api = {
  /**
   * Fetch all entries
   */
  async getEntries(): Promise<Entry[]> {
    const response = await fetch(`${API_BASE}/entries`);
    return handleResponse<Entry[]>(response, 'Failed to fetch entries');
  },

  /**
   * Fetch a single entry by ID
   */
  async getEntry(id: number): Promise<Entry> {
    const response = await fetch(`${API_BASE}/entries/${id}`);
    return handleResponse<Entry>(response, 'Failed to fetch entry');
  },

  /**
   * Create a new entry
   */
  async createEntry(data: CreateEntryRequest): Promise<Entry> {
    const response = await fetch(`${API_BASE}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Entry>(response, 'Failed to create entry');
  },

  /**
   * Update an existing entry
   */
  async updateEntry(id: number, data: UpdateEntryRequest): Promise<Entry> {
    const response = await fetch(`${API_BASE}/entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Entry>(response, 'Failed to update entry');
  },

  /**
   * Delete an entry
   */
  async deleteEntry(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/entries/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiError('Entry not found', 404);
      }
      throw new ApiError('Failed to delete entry', response.status);
    }
  },

  /**
   * Search entries by keyword
   */
  async searchEntries(query: string): Promise<Entry[]> {
    if (!query.trim()) {
      throw new Error('Search query is required');
    }
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(`${API_BASE}/entries/search?q=${encodedQuery}`);
    return handleResponse<Entry[]>(response, 'Failed to search entries');
  },
};

export { ApiError };
