import { describe, it, expect } from 'vitest';
import { entryReducer, initialState, EntryState, EntryAction } from '@/contexts/entryReducer';
import type { Entry } from '@/types/Entry';

describe('entryReducer', () => {
  const mockEntry: Entry = {
    id: 1,
    date: '2026-01-31',
    content: 'Test entry content',
    created_at: '2026-01-31T12:00:00.000Z',
    updated_at: '2026-01-31T12:00:00.000Z',
  };

  const mockEntry2: Entry = {
    id: 2,
    date: '2026-02-01',
    content: 'Another entry',
    created_at: '2026-02-01T12:00:00.000Z',
    updated_at: '2026-02-01T12:00:00.000Z',
  };

  describe('initialState', () => {
    it('has correct initial values', () => {
      expect(initialState).toEqual({
        entries: [],
        currentEntry: null,
        isLoading: false,
        error: null,
        searchQuery: '',
      });
    });
  });

  describe('SET_LOADING', () => {
    it('sets loading state to true', () => {
      const action: EntryAction = { type: 'SET_LOADING', payload: true };
      const newState = entryReducer(initialState, action);

      expect(newState.isLoading).toBe(true);
      expect(newState.error).toBe(null);
    });

    it('sets loading state to false', () => {
      const loadingState: EntryState = { ...initialState, isLoading: true };
      const action: EntryAction = { type: 'SET_LOADING', payload: false };
      const newState = entryReducer(loadingState, action);

      expect(newState.isLoading).toBe(false);
    });
  });

  describe('SET_ERROR', () => {
    it('sets error message', () => {
      const action: EntryAction = { type: 'SET_ERROR', payload: 'Something went wrong' };
      const newState = entryReducer(initialState, action);

      expect(newState.error).toBe('Something went wrong');
      expect(newState.isLoading).toBe(false);
    });

    it('clears error when null', () => {
      const errorState: EntryState = { ...initialState, error: 'Previous error' };
      const action: EntryAction = { type: 'SET_ERROR', payload: null };
      const newState = entryReducer(errorState, action);

      expect(newState.error).toBe(null);
    });
  });

  describe('SET_ENTRIES', () => {
    it('sets entries list', () => {
      const entries = [mockEntry, mockEntry2];
      const action: EntryAction = { type: 'SET_ENTRIES', payload: entries };
      const newState = entryReducer(initialState, action);

      expect(newState.entries).toEqual(entries);
      expect(newState.isLoading).toBe(false);
    });

    it('clears entries when empty array', () => {
      const stateWithEntries: EntryState = { ...initialState, entries: [mockEntry] };
      const action: EntryAction = { type: 'SET_ENTRIES', payload: [] };
      const newState = entryReducer(stateWithEntries, action);

      expect(newState.entries).toEqual([]);
    });
  });

  describe('SET_CURRENT_ENTRY', () => {
    it('sets current entry', () => {
      const action: EntryAction = { type: 'SET_CURRENT_ENTRY', payload: mockEntry };
      const newState = entryReducer(initialState, action);

      expect(newState.currentEntry).toEqual(mockEntry);
      expect(newState.isLoading).toBe(false);
    });

    it('clears current entry when null', () => {
      const stateWithEntry: EntryState = { ...initialState, currentEntry: mockEntry };
      const action: EntryAction = { type: 'SET_CURRENT_ENTRY', payload: null };
      const newState = entryReducer(stateWithEntry, action);

      expect(newState.currentEntry).toBe(null);
    });
  });

  describe('ADD_ENTRY', () => {
    it('adds new entry to the beginning of the list', () => {
      const stateWithEntry: EntryState = { ...initialState, entries: [mockEntry] };
      const action: EntryAction = { type: 'ADD_ENTRY', payload: mockEntry2 };
      const newState = entryReducer(stateWithEntry, action);

      expect(newState.entries).toHaveLength(2);
      expect(newState.entries[0]).toEqual(mockEntry2);
    });

    it('adds entry to empty list', () => {
      const action: EntryAction = { type: 'ADD_ENTRY', payload: mockEntry };
      const newState = entryReducer(initialState, action);

      expect(newState.entries).toHaveLength(1);
      expect(newState.entries[0]).toEqual(mockEntry);
    });
  });

  describe('UPDATE_ENTRY', () => {
    it('updates existing entry in the list', () => {
      const stateWithEntries: EntryState = { ...initialState, entries: [mockEntry2, mockEntry] };
      const updatedEntry = { ...mockEntry, content: 'Updated content' };
      const action: EntryAction = { type: 'UPDATE_ENTRY', payload: updatedEntry };
      const newState = entryReducer(stateWithEntries, action);

      expect(newState.entries).toHaveLength(2);
      expect(newState.entries[1].content).toBe('Updated content');
    });

    it('updates current entry if it matches', () => {
      const stateWithCurrentEntry: EntryState = {
        ...initialState,
        entries: [mockEntry],
        currentEntry: mockEntry
      };
      const updatedEntry = { ...mockEntry, content: 'Updated content' };
      const action: EntryAction = { type: 'UPDATE_ENTRY', payload: updatedEntry };
      const newState = entryReducer(stateWithCurrentEntry, action);

      expect(newState.currentEntry?.content).toBe('Updated content');
    });

    it('does not update if entry not found', () => {
      const stateWithEntry: EntryState = { ...initialState, entries: [mockEntry] };
      const unknownEntry = { ...mockEntry2, id: 999 };
      const action: EntryAction = { type: 'UPDATE_ENTRY', payload: unknownEntry };
      const newState = entryReducer(stateWithEntry, action);

      expect(newState.entries).toHaveLength(1);
      expect(newState.entries[0]).toEqual(mockEntry);
    });
  });

  describe('DELETE_ENTRY', () => {
    it('removes entry from the list', () => {
      const stateWithEntries: EntryState = { ...initialState, entries: [mockEntry2, mockEntry] };
      const action: EntryAction = { type: 'DELETE_ENTRY', payload: 1 };
      const newState = entryReducer(stateWithEntries, action);

      expect(newState.entries).toHaveLength(1);
      expect(newState.entries[0].id).toBe(2);
    });

    it('clears current entry if deleted', () => {
      const stateWithCurrentEntry: EntryState = {
        ...initialState,
        entries: [mockEntry],
        currentEntry: mockEntry
      };
      const action: EntryAction = { type: 'DELETE_ENTRY', payload: 1 };
      const newState = entryReducer(stateWithCurrentEntry, action);

      expect(newState.entries).toHaveLength(0);
      expect(newState.currentEntry).toBe(null);
    });

    it('does nothing if entry not found', () => {
      const stateWithEntry: EntryState = { ...initialState, entries: [mockEntry] };
      const action: EntryAction = { type: 'DELETE_ENTRY', payload: 999 };
      const newState = entryReducer(stateWithEntry, action);

      expect(newState.entries).toHaveLength(1);
    });
  });

  describe('SET_SEARCH_QUERY', () => {
    it('sets search query', () => {
      const action: EntryAction = { type: 'SET_SEARCH_QUERY', payload: 'test query' };
      const newState = entryReducer(initialState, action);

      expect(newState.searchQuery).toBe('test query');
    });

    it('clears search query with empty string', () => {
      const stateWithQuery: EntryState = { ...initialState, searchQuery: 'old query' };
      const action: EntryAction = { type: 'SET_SEARCH_QUERY', payload: '' };
      const newState = entryReducer(stateWithQuery, action);

      expect(newState.searchQuery).toBe('');
    });
  });

  describe('CLEAR_ERROR', () => {
    it('clears error state', () => {
      const errorState: EntryState = { ...initialState, error: 'Some error' };
      const action: EntryAction = { type: 'CLEAR_ERROR' };
      const newState = entryReducer(errorState, action);

      expect(newState.error).toBe(null);
    });
  });
});
