import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { EntryListPage } from '@/pages/EntryListPage';
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

const mockEntries: Entry[] = [
  {
    id: 1,
    date: '2026-01-31',
    content: 'First entry',
    created_at: '2026-01-31T12:00:00.000Z',
    updated_at: '2026-01-31T12:00:00.000Z',
  },
  {
    id: 2,
    date: '2026-02-01',
    content: 'Second entry',
    created_at: '2026-02-01T12:00:00.000Z',
    updated_at: '2026-02-01T12:00:00.000Z',
  },
];

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <EntryProvider>{ui}</EntryProvider>
    </BrowserRouter>
  );
};

describe('EntryListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', async () => {
    vi.mocked(api.getEntries).mockResolvedValue([]);
    renderWithProviders(<EntryListPage />);

    expect(screen.getByRole('heading', { name: /entries/i })).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    vi.mocked(api.getEntries).mockImplementation(() => new Promise(() => {}));
    renderWithProviders(<EntryListPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('loads and displays entries', async () => {
    vi.mocked(api.getEntries).mockResolvedValue(mockEntries);
    renderWithProviders(<EntryListPage />);

    await waitFor(() => {
      expect(screen.getByText('First entry')).toBeInTheDocument();
      expect(screen.getByText('Second entry')).toBeInTheDocument();
    });
  });

  it('shows error message on fetch failure', async () => {
    vi.mocked(api.getEntries).mockRejectedValue(new Error('Failed to fetch entries'));
    renderWithProviders(<EntryListPage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch entries/i)).toBeInTheDocument();
    });
  });

  it('renders new entry button', async () => {
    vi.mocked(api.getEntries).mockResolvedValue([]);
    renderWithProviders(<EntryListPage />);

    expect(screen.getByRole('link', { name: /new entry/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /new entry/i })).toHaveAttribute(
      'href',
      '/entries/new'
    );
  });

  it('renders search bar', async () => {
    vi.mocked(api.getEntries).mockResolvedValue([]);
    renderWithProviders(<EntryListPage />);

    expect(screen.getByPlaceholderText(/search entries/i)).toBeInTheDocument();
  });

  it('searches entries when search is submitted', async () => {
    vi.mocked(api.getEntries).mockResolvedValue(mockEntries);
    vi.mocked(api.searchEntries).mockResolvedValue([mockEntries[0]]);
    renderWithProviders(<EntryListPage />);

    await waitFor(() => {
      expect(screen.getByText('First entry')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search entries/i);
    await userEvent.type(searchInput, 'First');

    const form = searchInput.closest('form');
    await userEvent.click(form!.querySelector('button[type="submit"]')!);

    await waitFor(() => {
      expect(api.searchEntries).toHaveBeenCalledWith('First');
    });
  });
});
