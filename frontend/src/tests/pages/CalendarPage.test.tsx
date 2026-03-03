import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { CalendarPage } from '@/pages/CalendarPage';
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
    date: '2026-01-15',
    content: 'January entry',
    created_at: '2026-01-15T12:00:00.000Z',
    updated_at: '2026-01-15T12:00:00.000Z',
  },
  {
    id: 2,
    date: '2026-01-15',
    content: 'Another January entry',
    created_at: '2026-01-15T13:00:00.000Z',
    updated_at: '2026-01-15T13:00:00.000Z',
  },
  {
    id: 3,
    date: '2026-01-20',
    content: 'Third entry',
    created_at: '2026-01-20T12:00:00.000Z',
    updated_at: '2026-01-20T12:00:00.000Z',
  },
];

const renderCalendar = () => {
  return render(
    <BrowserRouter>
      <CalendarPage />
    </BrowserRouter>
  );
};

describe('CalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getEntriesByMonth).mockResolvedValue(mockEntries);
  });

  it('renders the calendar heading', async () => {
    renderCalendar();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    await waitFor(() => {
      expect(api.getEntriesByMonth).toHaveBeenCalled();
    });
  });

  it('displays day-of-week headers', async () => {
    renderCalendar();
    await waitFor(() => {
      expect(api.getEntriesByMonth).toHaveBeenCalled();
    });
    for (const day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
  });

  it('navigates to previous month', async () => {
    const user = userEvent.setup();
    renderCalendar();
    await waitFor(() => {
      expect(api.getEntriesByMonth).toHaveBeenCalled();
    });

    const prevButton = screen.getByLabelText('Previous month');
    await user.click(prevButton);

    await waitFor(() => {
      expect(api.getEntriesByMonth).toHaveBeenCalledTimes(2);
    });
  });

  it('navigates to next month', async () => {
    const user = userEvent.setup();
    renderCalendar();
    await waitFor(() => {
      expect(api.getEntriesByMonth).toHaveBeenCalled();
    });

    const nextButton = screen.getByLabelText('Next month');
    await user.click(nextButton);

    await waitFor(() => {
      expect(api.getEntriesByMonth).toHaveBeenCalledTimes(2);
    });
  });

  it('shows entries when a date with entries is clicked', async () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`;

    vi.mocked(api.getEntriesByMonth).mockResolvedValue([
      {
        id: 1,
        date: dateStr,
        content: 'Entry for day 15',
        created_at: `${dateStr}T12:00:00.000Z`,
        updated_at: `${dateStr}T12:00:00.000Z`,
      },
    ]);

    const user = userEvent.setup();
    renderCalendar();
    await waitFor(() => {
      expect(api.getEntriesByMonth).toHaveBeenCalled();
    });

    const dayButton = screen.getByLabelText(`${currentMonth}月15日 エントリあり`);
    expect(dayButton).toBeInTheDocument();
    await user.click(dayButton);

    expect(screen.getByText('Entry for day 15')).toBeInTheDocument();
    expect(screen.getByText(dateStr)).toBeInTheDocument();
  });

  it('shows "No entries" for a date without entries', async () => {
    vi.mocked(api.getEntriesByMonth).mockResolvedValue([]);
    const user = userEvent.setup();
    renderCalendar();
    await waitFor(() => {
      expect(api.getEntriesByMonth).toHaveBeenCalled();
    });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const dayButton = screen.getByLabelText(`${currentMonth}月1日`);
    expect(dayButton).toBeInTheDocument();
    await user.click(dayButton);

    expect(screen.getByText('No entries for this date.')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(api.getEntriesByMonth).mockImplementation(() => new Promise(() => {}));
    renderCalendar();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    vi.mocked(api.getEntriesByMonth).mockRejectedValue(new Error('Network error'));
    renderCalendar();
    await waitFor(() => {
      expect(screen.getByText('Failed to load entries.')).toBeInTheDocument();
    });
  });

  it('has a link back to list', async () => {
    renderCalendar();
    const link = screen.getByText('Back to List');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/');
    await waitFor(() => {
      expect(api.getEntriesByMonth).toHaveBeenCalled();
    });
  });

  it('sets aria-pressed on selected date', async () => {
    vi.mocked(api.getEntriesByMonth).mockResolvedValue([]);
    const user = userEvent.setup();
    renderCalendar();
    await waitFor(() => {
      expect(api.getEntriesByMonth).toHaveBeenCalled();
    });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const dayButton = screen.getByLabelText(`${currentMonth}月5日`);
    expect(dayButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(dayButton);
    expect(dayButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(dayButton);
    expect(dayButton).toHaveAttribute('aria-pressed', 'false');
  });
});
