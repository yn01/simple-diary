import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEntries } from '@/contexts/EntryContext';

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString();
}

export function EntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentEntry, isLoading, error, fetchEntry, deleteEntry, clearCurrentEntry } =
    useEntries();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEntry(parseInt(id, 10));
    }
    return () => {
      clearCurrentEntry();
    };
  }, [id, fetchEntry, clearCurrentEntry]);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteEntry(parseInt(id, 10));
      navigate('/');
    } catch {
      setIsDeleting(false);
    }
  }, [id, deleteEntry, navigate]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

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
      <Link
        to="/"
        className="inline-flex items-center mb-6 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
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

      <div className="bg-white rounded-lg shadow p-6 dark:bg-slate-900 dark:border dark:border-slate-700">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {currentEntry.date}
          </h1>
          <div className="flex gap-2">
            <Link
              to={`/entries/${currentEntry.id}/edit`}
              className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-medium dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit
            </Link>
            <button
              onClick={handleDeleteClick}
              className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-medium dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-900/50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Delete
            </button>
          </div>
        </div>

        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap break-words dark:text-slate-200">
            {currentEntry.content}
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500 space-y-1 dark:border-slate-700 dark:text-slate-400">
          <p>
            <span className="font-medium">Created:</span> {formatDateTime(currentEntry.created_at)}
          </p>
          <p>
            <span className="font-medium">Updated:</span> {formatDateTime(currentEntry.updated_at)}
          </p>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl dark:bg-slate-900 dark:border dark:border-slate-700">
            <h2 className="text-lg font-bold text-gray-900 mb-2 dark:text-slate-100">
              Delete Entry
            </h2>
            <p className="text-gray-600 mb-6 dark:text-slate-300">
              Are you sure you want to delete this entry? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors font-medium"
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
