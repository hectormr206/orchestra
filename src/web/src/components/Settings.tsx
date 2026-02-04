import { useState } from 'react';

export default function Settings() {
  const [serverUrl, setServerUrl] = useState('http://localhost:8080');
  const [authToken, setAuthToken] = useState('');
  const [theme, setTheme] = useState('dark');

  const handleSave = () => {
    localStorage.setItem('orchestra-server-url', serverUrl);
    localStorage.setItem('orchestra-auth-token', authToken);
    localStorage.setItem('orchestra-theme', theme);
    alert('Settings saved!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure Orchestra web interface
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6 space-y-6">
          {/* Server URL */}
          <div>
            <label htmlFor="server-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Server URL
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="server-url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="http://localhost:8080"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                URL of the Orchestra server
              </p>
            </div>
          </div>

          {/* Auth Token */}
          <div>
            <label htmlFor="auth-token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Auth Token (Optional)
            </label>
            <div className="mt-1">
              <input
                type="password"
                id="auth-token"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter authentication token"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Token for authenticated requests (if required)
              </p>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Theme
            </label>
            <div className="mt-1">
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-5">
            <button
              onClick={handleSave}
              className="w-full sm:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-400 dark:text-blue-300 text-xl">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Orchestra Web UI
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                Version 0.1.0 - A modern web interface for Orchestra CLI.
                Requires Orchestra Server to be running.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
