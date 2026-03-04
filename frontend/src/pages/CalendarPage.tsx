import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { Entry } from '@/types/Entry';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    api
      .getEntriesByMonth(year, month, controller.signal)
      .then((data) => {
        setEntries(data);
        setIsLoading(false);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Failed to load entries.');
        setIsLoading(false);
      });
    return () => controller.abort();
  }, [year, month]);

  const goToPrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDate(null);
  };

  const entriesByDate = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of entries) {
      const list = map.get(entry.date) || [];
      list.push(entry);
      map.set(entry.date, list);
    }
    return map;
  }, [entries]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const selectedEntries = selectedDate ? entriesByDate.get(selectedDate) || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Calendar</h1>
        <Link
          to="/"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          Back to List
        </Link>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={goToPrevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Previous month"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <span className="text-lg font-semibold text-gray-900 dark:text-slate-100 min-w-[160px] text-center">
          {year} / {String(month).padStart(2, '0')}
        </span>
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Next month"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="text-center py-4 text-gray-500 dark:text-slate-400">Loading...</div>
      )}
      {error && <div className="text-center py-4 text-red-600 dark:text-red-400">{error}</div>}

      {/* Calendar grid */}
      {!isLoading && !error && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-7">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-sm font-medium text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700"
              >
                {day}
              </div>
            ))}
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="h-14 border-b border-r border-gray-100 dark:border-slate-700"
              />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = formatDate(year, month, day);
              const hasEntries = entriesByDate.has(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday =
                year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();

              const ariaLabel = `${month}月${day}日${hasEntries ? ' エントリあり' : ''}`;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  aria-label={ariaLabel}
                  aria-pressed={isSelected}
                  className={`h-14 flex flex-col items-center justify-center border-b border-r border-gray-100 dark:border-slate-700 transition-colors relative focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:z-10
                    ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}
                    ${isToday ? 'font-bold' : ''}
                  `}
                >
                  <span
                    className={`text-sm ${
                      isToday
                        ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center'
                        : 'text-gray-900 dark:text-slate-100'
                    }`}
                  >
                    {day}
                  </span>
                  {hasEntries && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected date entries */}
      {selectedDate && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            {selectedDate}
          </h2>
          {selectedEntries.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-400">No entries for this date.</p>
          ) : (
            <div className="space-y-2">
              {selectedEntries.map((entry) => (
                <Link
                  key={entry.id}
                  to={`/entries/${entry.id}`}
                  className="block p-4 bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <p className="text-gray-900 dark:text-slate-100 line-clamp-2">{entry.content}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
