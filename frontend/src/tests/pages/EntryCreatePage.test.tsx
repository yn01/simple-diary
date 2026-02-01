import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { EntryCreatePage } from '@/pages/EntryCreatePage';
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
  content: 'Test entry',
  created_at: '2026-01-31T12:00:00.000Z',
  updated_at: '2026-01-31T12:00:00.000Z',
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <EntryProvider>{ui}</EntryProvider>
    </BrowserRouter>
  );
};

describe('EntryCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    renderWithProviders(<EntryCreatePage />);

    expect(screen.getByRole('heading', { name: /new entry/i })).toBeInTheDocument();
  });

  it('renders entry form', () => {
    renderWithProviders(<EntryCreatePage />);

    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('creates entry and navigates to list on success', async () => {
    vi.mocked(api.createEntry).mockResolvedValue(mockEntry);
    renderWithProviders(<EntryCreatePage />);

    const contentInput = screen.getByLabelText(/content/i);
    await userEvent.type(contentInput, 'New diary entry');

    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(api.createEntry).toHaveBeenCalledWith({
        date: expect.any(String),
        content: 'New diary entry',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows error message on creation failure', async () => {
    vi.mocked(api.createEntry).mockRejectedValue(new Error('Failed to create entry'));
    renderWithProviders(<EntryCreatePage />);

    const contentInput = screen.getByLabelText(/content/i);
    await userEvent.type(contentInput, 'New entry');

    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to create entry/i)).toBeInTheDocument();
    });
  });

  it('navigates back on cancel', async () => {
    renderWithProviders(<EntryCreatePage />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
