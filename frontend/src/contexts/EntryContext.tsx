import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { entryReducer, initialState, EntryState } from './entryReducer';
import { api } from '@/services/api';
import type { Entry, CreateEntryRequest, UpdateEntryRequest } from '@/types/Entry';

interface EntryContextType extends EntryState {
  fetchEntries: () => Promise<void>;
  fetchEntry: (id: number) => Promise<void>;
  createEntry: (data: CreateEntryRequest) => Promise<Entry>;
  updateEntry: (id: number, data: UpdateEntryRequest) => Promise<Entry>;
  deleteEntry: (id: number) => Promise<void>;
  searchEntries: (query: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  clearError: () => void;
  clearCurrentEntry: () => void;
}

const EntryContext = createContext<EntryContextType | undefined>(undefined);

interface EntryProviderProps {
  children: ReactNode;
}

export function EntryProvider({ children }: EntryProviderProps) {
  const [state, dispatch] = useReducer(entryReducer, initialState);

  const fetchEntries = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const entries = await api.getEntries();
      dispatch({ type: 'SET_ENTRIES', payload: entries });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch entries';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  }, []);

  const fetchEntry = useCallback(async (id: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const entry = await api.getEntry(id);
      dispatch({ type: 'SET_CURRENT_ENTRY', payload: entry });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch entry';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  }, []);

  const createEntry = useCallback(async (data: CreateEntryRequest): Promise<Entry> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const entry = await api.createEntry(data);
      dispatch({ type: 'ADD_ENTRY', payload: entry });
      dispatch({ type: 'SET_LOADING', payload: false });
      return entry;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create entry';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  }, []);

  const updateEntry = useCallback(async (id: number, data: UpdateEntryRequest): Promise<Entry> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const entry = await api.updateEntry(id, data);
      dispatch({ type: 'UPDATE_ENTRY', payload: entry });
      dispatch({ type: 'SET_LOADING', payload: false });
      return entry;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update entry';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  }, []);

  const deleteEntry = useCallback(async (id: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await api.deleteEntry(id);
      dispatch({ type: 'DELETE_ENTRY', payload: id });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete entry';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  }, []);

  const searchEntries = useCallback(async (query: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    try {
      const entries = await api.searchEntries(query);
      dispatch({ type: 'SET_ENTRIES', payload: entries });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search entries';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const clearCurrentEntry = useCallback(() => {
    dispatch({ type: 'SET_CURRENT_ENTRY', payload: null });
  }, []);

  const value: EntryContextType = {
    ...state,
    fetchEntries,
    fetchEntry,
    createEntry,
    updateEntry,
    deleteEntry,
    searchEntries,
    setSearchQuery,
    clearError,
    clearCurrentEntry,
  };

  return <EntryContext.Provider value={value}>{children}</EntryContext.Provider>;
}

export function useEntries(): EntryContextType {
  const context = useContext(EntryContext);
  if (context === undefined) {
    throw new Error('useEntries must be used within an EntryProvider');
  }
  return context;
}
