import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/SearchBar';

describe('SearchBar', () => {
  it('renders search input', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    expect(screen.getByPlaceholderText('Search entries...')).toBeInTheDocument();
  });

  it('calls onSearch when form is submitted', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search entries...');
    await userEvent.type(input, 'test query');

    const form = input.closest('form');
    fireEvent.submit(form!);

    expect(onSearch).toHaveBeenCalledWith('test query');
  });

  it('calls onClear when clear button is clicked', async () => {
    const onSearch = vi.fn();
    const onClear = vi.fn();
    render(<SearchBar onSearch={onSearch} onClear={onClear} value="existing" />);

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await userEvent.click(clearButton);

    expect(onClear).toHaveBeenCalled();
  });

  it('does not show clear button when value is empty', () => {
    render(<SearchBar onSearch={vi.fn()} value="" />);

    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('shows clear button when value is not empty', () => {
    render(<SearchBar onSearch={vi.fn()} value="test" onClear={vi.fn()} />);

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(<SearchBar onSearch={vi.fn()} isLoading />);

    const button = screen.getByRole('button', { name: /search/i });
    expect(button).toBeDisabled();
  });

  it('does not submit when query is empty', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const form = screen.getByPlaceholderText('Search entries...').closest('form');
    fireEvent.submit(form!);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('trims whitespace from search query', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search entries...');
    await userEvent.type(input, '  test  ');

    const form = input.closest('form');
    fireEvent.submit(form!);

    expect(onSearch).toHaveBeenCalledWith('test');
  });
});
