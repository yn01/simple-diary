import type { Entry } from '@/types/Entry';

export interface EntryState {
  entries: Entry[];
  currentEntry: Entry | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
}

export type EntryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ENTRIES'; payload: Entry[] }
  | { type: 'SET_CURRENT_ENTRY'; payload: Entry | null }
  | { type: 'ADD_ENTRY'; payload: Entry }
  | { type: 'UPDATE_ENTRY'; payload: Entry }
  | { type: 'DELETE_ENTRY'; payload: number }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'CLEAR_ERROR' };

export const initialState: EntryState = {
  entries: [],
  currentEntry: null,
  isLoading: false,
  error: null,
  searchQuery: '',
};

export function entryReducer(state: EntryState, action: EntryAction): EntryState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'SET_ENTRIES':
      return {
        ...state,
        entries: action.payload,
        isLoading: false,
      };

    case 'SET_CURRENT_ENTRY':
      return {
        ...state,
        currentEntry: action.payload,
        isLoading: false,
      };

    case 'ADD_ENTRY': {
      const newEntries = [action.payload, ...state.entries];
      newEntries.sort((a, b) => b.date.localeCompare(a.date));
      return {
        ...state,
        entries: newEntries,
      };
    }

    case 'UPDATE_ENTRY': {
      const updatedEntries = state.entries.map((entry) =>
        entry.id === action.payload.id ? action.payload : entry
      );
      updatedEntries.sort((a, b) => b.date.localeCompare(a.date));
      return {
        ...state,
        entries: updatedEntries,
        currentEntry:
          state.currentEntry?.id === action.payload.id
            ? action.payload
            : state.currentEntry,
      };
    }

    case 'DELETE_ENTRY':
      return {
        ...state,
        entries: state.entries.filter((entry) => entry.id !== action.payload),
        currentEntry:
          state.currentEntry?.id === action.payload ? null : state.currentEntry,
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}
