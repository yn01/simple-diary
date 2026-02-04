import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { EntryProvider } from '@/contexts/EntryContext';
import { EntryListPage } from '@/pages/EntryListPage';
import { EntryCreatePage } from '@/pages/EntryCreatePage';
import { EntryDetailPage } from '@/pages/EntryDetailPage';
import { EntryEditPage } from '@/pages/EntryEditPage';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
      return;
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    setTheme(prefersDark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  return (
    <Router>
      <EntryProvider>
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-900 dark:text-slate-100">
          <header className="bg-white shadow dark:bg-slate-950">
            <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
              <Link
                to="/"
                className="text-3xl font-bold text-gray-900 hover:text-blue-600 transition-colors dark:text-slate-100 dark:hover:text-blue-400"
              >
                Simple Diary
              </Link>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 2a.75.75 0 01.75.75V4a.75.75 0 01-1.5 0V2.75A.75.75 0 0110 2zm0 14a.75.75 0 01.75.75V18a.75.75 0 01-1.5 0v-1.25A.75.75 0 0110 16zm8-6a.75.75 0 01-.75.75H16a.75.75 0 010-1.5h1.25A.75.75 0 0118 10zm-14 0a.75.75 0 01-.75.75H2a.75.75 0 010-1.5h1.25A.75.75 0 014 10zm10.303-5.303a.75.75 0 011.06 0l.884.884a.75.75 0 11-1.06 1.06l-.884-.884a.75.75 0 010-1.06zm-9.435 9.435a.75.75 0 011.06 0l.884.884a.75.75 0 11-1.06 1.06l-.884-.884a.75.75 0 010-1.06zm9.435 1.06a.75.75 0 010 1.06l-.884.884a.75.75 0 11-1.06-1.06l.884-.884a.75.75 0 011.06 0zM5.243 4.757a.75.75 0 010 1.06l-.884.884a.75.75 0 11-1.06-1.06l.884-.884a.75.75 0 011.06 0zM10 6.25A3.75 3.75 0 1013.75 10 3.755 3.755 0 0010 6.25z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M17.293 13.293a8 8 0 01-10.586-10.586 8 8 0 1010.586 10.586z" />
                  </svg>
                )}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </header>
          <main>
            <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/" element={<EntryListPage />} />
                <Route path="/entries/new" element={<EntryCreatePage />} />
                <Route path="/entries/:id" element={<EntryDetailPage />} />
                <Route path="/entries/:id/edit" element={<EntryEditPage />} />
              </Routes>
            </div>
          </main>
        </div>
      </EntryProvider>
    </Router>
  );
}

export default App;
