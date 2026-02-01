import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntries } from '@/contexts/EntryContext';
import { EntryForm } from '@/components/EntryForm';
import type { CreateEntryRequest } from '@/types/Entry';

export function EntryCreatePage() {
  const navigate = useNavigate();
  const { createEntry } = useEntries();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (data: CreateEntryRequest) => {
    setSubmitError(null);
    try {
      await createEntry(data);
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create entry';
      setSubmitError(message);
    }
  }, [createEntry, navigate]);

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Entry</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <EntryForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitError={submitError}
        />
      </div>
    </div>
  );
}
