import { Link } from 'react-router-dom';
import type { Entry } from '@/types/Entry';

interface EntryListProps {
  entries: Entry[];
  isLoading?: boolean;
  error?: string | null;
}

function truncateContent(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength) + '...';
}

export function EntryList({ entries, isLoading = false, error = null }: EntryListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-2">
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No entries</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new entry.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <Link
          key={entry.id}
          to={`/entries/${entry.id}`}
          className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <time className="text-sm font-medium text-blue-600">{entry.date}</time>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap break-words">
              {truncateContent(entry.content)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
