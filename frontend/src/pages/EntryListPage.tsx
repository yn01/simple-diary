import { useEffect, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEntries } from '@/contexts/EntryContext';
import { EntryList } from '@/components/EntryList';
import { SearchBar } from '@/components/SearchBar';

export function EntryListPage() {
  const { entries, isLoading, error, fetchEntries, searchEntries, setSearchQuery, searchQuery } =
    useEntries();
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSearch = useCallback(
    async (query: string) => {
      setLocalSearchQuery(query);
      await searchEntries(query);
    },
    [searchEntries]
  );

  const handleClearSearch = useCallback(() => {
    setLocalSearchQuery('');
    setSearchQuery('');
    fetchEntries();
  }, [fetchEntries, setSearchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Entries</h1>
        <Link
          to="/entries/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          New Entry
        </Link>
      </div>

      <div className="max-w-md">
        <SearchBar
          onSearch={handleSearch}
          onClear={handleClearSearch}
          value={localSearchQuery || searchQuery}
          isLoading={isLoading}
        />
      </div>

      <EntryList entries={entries} isLoading={isLoading} error={error} />
    </div>
  );
}
