import { useState, FormEvent } from 'react';
import { z } from 'zod';
import type { Entry, CreateEntryRequest, UpdateEntryRequest } from '@/types/Entry';

const entrySchema = z.object({
  date: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  content: z
    .string()
    .min(1, 'Content is required')
    .refine((val) => val.trim().length > 0, { message: 'Content cannot be only whitespace' }),
});

interface EntryFormProps {
  entry?: Entry;
  onSubmit: (data: CreateEntryRequest | UpdateEntryRequest) => Promise<void>;
  onCancel?: () => void;
  submitError?: string | null;
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function EntryForm({ entry, onSubmit, onCancel, submitError }: EntryFormProps) {
  const [date, setDate] = useState(entry?.date || getTodayDate());
  const [content, setContent] = useState(entry?.content || '');
  const [errors, setErrors] = useState<{ date?: string; content?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!entry;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = entrySchema.safeParse({ date, content });
    if (!result.success) {
      const fieldErrors: { date?: string; content?: string } = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as 'date' | 'content';
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ date, content });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {submitError}
        </div>
      )}

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          Date
        </label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
            errors.date ? 'border-red-300' : 'border-gray-300'
          }`}
          disabled={isSubmitting}
        />
        {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-y ${
            errors.content ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Write your diary entry..."
          disabled={isSubmitting}
        />
        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
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
              Saving...
            </span>
          ) : isEditMode ? (
            'Update'
          ) : (
            'Save'
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
