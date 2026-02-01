import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { EntryEditPage } from '@/pages/EntryEditPage';
import { EntryProvider } from '@/contexts/EntryContext';
import { api } from '@/services/api';
import type { Entry } from '@/types/Entry';

vi.mock('@/services/api');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockEntry: Entry = {
  id: 1,
  date: '2026-01-31',
  content: 'Original content',
  created_at: '2026-01-31T12:00:00.000Z',
  updated_at: '2026-01-31T12:00:00.000Z',
};

const renderWithRouter = (entryId: string = '1') => {
  return render(
    <MemoryRouter initialEntries={[`/entries/${entryId}/edit`]}>
      <EntryProvider>
        <Routes>
          <Route path="/entries/:id/edit" element={<EntryEditPage />} />
        </Routes>
      </EntryProvider>
    </MemoryRouter>
  );
};

describe('EntryEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', async () => {
    vi.mocked(api.getEntry).mockImplementation(() => new Promise(() => {}));
    renderWithRouter();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders page title', async () => {
    vi.mocked(api.getEntry).mockResolvedValue(mockEntry);
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /edit entry/i })).toBeInTheDocument();
    });
  });

  it('loads and displays entry in form', async () => {
    vi.mocked(api.getEntry).mockResolvedValue(mockEntry);
    renderWithRouter();

    await waitFor(() => {
      const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
      const contentInput = screen.getByLabelText(/content/i) as HTMLTextAreaElement;

      expect(dateInput.value).toBe('2026-01-31');
      expect(contentInput.value).toBe('Original content');
    });
  });

  it('shows error message when entry not found', async () => {
    vi.mocked(api.getEntry).mockRejectedValue(new Error('Entry not found'));
    renderWithRouter('999');

    await waitFor(() => {
      expect(screen.getByText(/entry not found/i)).toBeInTheDocument();
    });
  });

  it('updates entry and navigates to detail page on success', async () => {
    vi.mocked(api.getEntry).mockResolvedValue(mockEntry);
    vi.mocked(api.updateEntry).mockResolvedValue({
      ...mockEntry,
      content: 'Updated content',
    });
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
    });

    const contentInput = screen.getByLabelText(/content/i);
    await userEvent.clear(contentInput);
    await userEvent.type(contentInput, 'Updated content');

    const submitButton = screen.getByRole('button', { name: /update/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(api.updateEntry).toHaveBeenCalledWith(1, {
        date: '2026-01-31',
        content: 'Updated content',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/entries/1');
    });
  });

  it('shows error message on update failure', async () => {
    vi.mocked(api.getEntry).mockResolvedValue(mockEntry);
    vi.mocked(api.updateEntry).mockRejectedValue(new Error('Failed to update entry'));
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /update/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to update entry/i)).toBeInTheDocument();
    });
  });

  it('navigates back on cancel', async () => {
    vi.mocked(api.getEntry).mockResolvedValue(mockEntry);
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
