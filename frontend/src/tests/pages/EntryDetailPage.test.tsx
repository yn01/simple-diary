import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { EntryDetailPage } from '@/pages/EntryDetailPage';
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
  content: 'Test entry content',
  created_at: '2026-01-31T12:00:00.000Z',
  updated_at: '2026-01-31T12:30:00.000Z',
};

const renderWithRouter = (entryId: string = '1') => {
  return render(
    <MemoryRouter initialEntries={[`/entries/${entryId}`]}>
      <EntryProvider>
        <Routes>
          <Route path="/entries/:id" element={<EntryDetailPage />} />
        </Routes>
      </EntryProvider>
    </MemoryRouter>
  );
};

describe('EntryDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', async () => {
    vi.mocked(api.getEntry).mockImplementation(() => new Promise(() => {}));
    renderWithRouter();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('loads and displays entry details', async () => {
    vi.mocked(api.getEntry).mockResolvedValue(mockEntry);
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('2026-01-31')).toBeInTheDocument();
      expect(screen.getByText('Test entry content')).toBeInTheDocument();
    });
  });

  it('shows error message when entry not found', async () => {
    vi.mocked(api.getEntry).mockRejectedValue(new Error('Entry not found'));
    renderWithRouter('999');

    await waitFor(() => {
      expect(screen.getByText(/entry not found/i)).toBeInTheDocument();
    });
  });

  it('renders edit button', async () => {
    vi.mocked(api.getEntry).mockResolvedValue(mockEntry);
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /edit/i })).toHaveAttribute('href', '/entries/1/edit');
    });
  });

  it('renders delete button', async () => {
    vi.mocked(api.getEntry).mockResolvedValue(mockEntry);
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
  });

  it('shows confirmation dialog when delete is clicked', async () => {
    vi.mocked(api.getEntry).mockResolvedValue(mockEntry);
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
  });

  it('deletes entry and navigates to list on confirmation', async () => {
    vi.mocked(api.getEntry).mockResolvedValue(mockEntry);
    vi.mocked(api.deleteEntry).mockResolvedValue(undefined);
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    const confirmButton = await screen.findByRole('button', { name: /confirm/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.deleteEntry).toHaveBeenCalledWith(1);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('cancels delete when cancel is clicked', async () => {
    vi.mocked(api.getEntry).mockResolvedValue(mockEntry);
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    const cancelButton = await screen.findByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
    });
  });

  it('displays created and updated timestamps', async () => {
    vi.mocked(api.getEntry).mockResolvedValue(mockEntry);
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/created/i)).toBeInTheDocument();
      expect(screen.getByText(/updated/i)).toBeInTheDocument();
    });
  });

  it('renders back to list link', async () => {
    vi.mocked(api.getEntry).mockResolvedValue(mockEntry);
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/');
    });
  });
});
