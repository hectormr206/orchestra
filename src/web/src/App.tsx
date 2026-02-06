import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Sessions from './components/Sessions';
import Plugins from './components/Plugins';
import Settings from './components/Settings';
import History from './screens/History';
import Analytics from './screens/Analytics';
import SessionCompare from './screens/SessionCompare';
import SessionDetailsWeb from './screens/SessionDetailsWeb';

function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const linkClass = (path: string) => {
    return isActive(path)
      ? 'border-indigo-500 text-gray-900 dark:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
      : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium';
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                🎼 Orchestra
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/" className={linkClass('/')}>
                Dashboard
              </Link>
              <Link to="/history" className={linkClass('/history')}>
                History
              </Link>
              <Link to="/analytics" className={linkClass('/analytics')}>
                Analytics
              </Link>
              <Link to="/sessions" className={linkClass('/sessions')}>
                Sessions
              </Link>
              <Link to="/plugins" className={linkClass('/plugins')}>
                Plugins
              </Link>
              <Link to="/settings" className={linkClass('/settings')}>
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />

        {/* Main content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/compare" element={<SessionCompare />} />
            <Route path="/session/:sessionId" element={<SessionDetailsWeb />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/sessions/:sessionId" element={<Sessions />} />
            <Route path="/plugins" element={<Plugins />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
