import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEntries } from '@/contexts/EntryContext';
import { EntryForm } from '@/components/EntryForm';
import type { UpdateEntryRequest } from '@/types/Entry';

export function EntryEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentEntry, isLoading, error, fetchEntry, updateEntry, clearCurrentEntry } =
    useEntries();
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchEntry(parseInt(id, 10));
    }
    return () => {
      clearCurrentEntry();
    };
  }, [id, fetchEntry, clearCurrentEntry]);

  const handleSubmit = useCallback(
    async (data: UpdateEntryRequest) => {
      if (!id) return;
      setSubmitError(null);
      try {
        await updateEntry(parseInt(id, 10), data);
        navigate(`/entries/${id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update entry';
        setSubmitError(message);
      }
    },
    [id, updateEntry, navigate]
  );

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

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
          <span className="text-gray-500 dark:text-slate-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200">
          {error}
        </div>
        <Link
          to="/"
          className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to list
        </Link>
      </div>
    );
  }

  if (!currentEntry) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 dark:text-slate-100">Edit Entry</h1>
      <div className="bg-white rounded-lg shadow p-6 dark:bg-slate-900 dark:border dark:border-slate-700">
        <EntryForm
          entry={currentEntry}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitError={submitError}
        />
      </div>
    </div>
  );
}
