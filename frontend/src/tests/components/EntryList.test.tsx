import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { EntryList } from '@/components/EntryList';
import type { Entry } from '@/types/Entry';

const mockEntries: Entry[] = [
  {
    id: 1,
    date: '2026-01-31',
    content: 'First entry content that is quite long and should be truncated after 100 characters to show only a preview of the content...',
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

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('EntryList', () => {
  it('renders list of entries', () => {
    renderWithRouter(<EntryList entries={mockEntries} />);

    expect(screen.getByText('2026-01-31')).toBeInTheDocument();
    expect(screen.getByText('2026-02-01')).toBeInTheDocument();
  });

  it('shows entry preview truncated to 100 characters', () => {
    renderWithRouter(<EntryList entries={mockEntries} />);

    // Check that the long content is truncated
    const preview = screen.getByText(/First entry content/);
    expect(preview.textContent?.length).toBeLessThanOrEqual(103); // 100 chars + "..."
  });

  it('shows empty state when no entries', () => {
    renderWithRouter(<EntryList entries={[]} />);

    expect(screen.getByText(/no entries/i)).toBeInTheDocument();
  });

  it('renders entries as links to detail page', () => {
    renderWithRouter(<EntryList entries={mockEntries} />);

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/entries/1');
    expect(links[1]).toHaveAttribute('href', '/entries/2');
  });

  it('shows loading state', () => {
    renderWithRouter(<EntryList entries={[]} isLoading />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error message', () => {
    renderWithRouter(<EntryList entries={[]} error="Failed to load entries" />);

    expect(screen.getByText('Failed to load entries')).toBeInTheDocument();
  });

  it('displays short content without truncation', () => {
    renderWithRouter(<EntryList entries={[mockEntries[1]]} />);

    expect(screen.getByText('Second entry')).toBeInTheDocument();
  });

  it('escapes HTML in content preview for XSS protection', () => {
    const xssEntry: Entry = {
      id: 3,
      date: '2026-02-02',
      content: '<script>alert("xss")</script>',
      created_at: '2026-02-02T12:00:00.000Z',
      updated_at: '2026-02-02T12:00:00.000Z',
    };
    renderWithRouter(<EntryList entries={[xssEntry]} />);

    // The script tag should be rendered as text, not executed
    expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
  });
});
