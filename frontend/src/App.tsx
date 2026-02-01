import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { EntryProvider } from '@/contexts/EntryContext';
import { EntryListPage } from '@/pages/EntryListPage';
import { EntryCreatePage } from '@/pages/EntryCreatePage';
import { EntryDetailPage } from '@/pages/EntryDetailPage';
import { EntryEditPage } from '@/pages/EntryEditPage';

function App() {
  return (
    <Router>
      <EntryProvider>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow">
            <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <Link to="/" className="text-3xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                Simple Diary
              </Link>
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
