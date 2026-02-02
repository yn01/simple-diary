import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { EntryForm } from '@/components/EntryForm';
import type { Entry } from '@/types/Entry';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('EntryForm', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Create Mode', () => {
    it('renders empty form for creation', () => {
      renderWithRouter(<EntryForm onSubmit={vi.fn()} />);

      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('sets default date to today', () => {
      renderWithRouter(<EntryForm onSubmit={vi.fn()} />);

      const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
      const today = new Date().toISOString().split('T')[0];
      expect(dateInput.value).toBe(today);
    });

    it('calls onSubmit with form data', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      renderWithRouter(<EntryForm onSubmit={onSubmit} />);

      const dateInput = screen.getByLabelText(/date/i);
      const contentInput = screen.getByLabelText(/content/i);
      const submitButton = screen.getByRole('button', { name: /save/i });

      await userEvent.clear(dateInput);
      await userEvent.type(dateInput, '2026-01-31');
      await userEvent.type(contentInput, 'New entry content');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          date: '2026-01-31',
          content: 'New entry content',
        });
      });
    });
  });

  describe('Edit Mode', () => {
    const existingEntry: Entry = {
      id: 1,
      date: '2026-01-31',
      content: 'Existing content',
      created_at: '2026-01-31T12:00:00.000Z',
      updated_at: '2026-01-31T12:00:00.000Z',
    };

    it('renders form with existing entry data', () => {
      renderWithRouter(<EntryForm onSubmit={vi.fn()} entry={existingEntry} />);

      const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
      const contentInput = screen.getByLabelText(/content/i) as HTMLTextAreaElement;

      expect(dateInput.value).toBe('2026-01-31');
      expect(contentInput.value).toBe('Existing content');
    });

    it('shows update button text when editing', () => {
      renderWithRouter(<EntryForm onSubmit={vi.fn()} entry={existingEntry} />);

      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error when content is empty', async () => {
      const onSubmit = vi.fn();
      renderWithRouter(<EntryForm onSubmit={onSubmit} />);

      const submitButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/content is required|content cannot be only whitespace/i)
        ).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows error when date is invalid', async () => {
      const onSubmit = vi.fn();
      renderWithRouter(<EntryForm onSubmit={onSubmit} />);

      const dateInput = screen.getByLabelText(/date/i);
      const contentInput = screen.getByLabelText(/content/i);

      await userEvent.clear(dateInput);
      await userEvent.type(contentInput, 'Some content');

      const submitButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        // When date is cleared, it shows "Invalid date format" or "Date is required"
        expect(screen.getByText(/invalid date format|date is required/i)).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('disables form during submission', async () => {
      const onSubmit = vi.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
      renderWithRouter(<EntryForm onSubmit={onSubmit} />);

      const contentInput = screen.getByLabelText(/content/i);
      await userEvent.type(contentInput, 'Test content');

      const submitButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Cancel Button', () => {
    it('renders cancel button', () => {
      renderWithRouter(<EntryForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('calls onCancel when cancel button clicked', async () => {
      const onCancel = vi.fn();
      renderWithRouter(<EntryForm onSubmit={vi.fn()} onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Error Display', () => {
    it('shows submission error', () => {
      renderWithRouter(<EntryForm onSubmit={vi.fn()} submitError="Failed to save entry" />);

      expect(screen.getByText('Failed to save entry')).toBeInTheDocument();
    });
  });
});
