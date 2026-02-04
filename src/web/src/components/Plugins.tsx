import { useEffect, useState } from 'react';
import api from '../lib/api';

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  official: boolean;
  tags: string[];
}

export default function Plugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    setLoading(true);
    try {
      const result = await api.listPlugins();
      setPlugins(result.plugins);
    } catch (err) {
      console.error('Failed to load plugins:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlugins = plugins.filter(
    (plugin) =>
      plugin.name.toLowerCase().includes(search.toLowerCase()) ||
      plugin.description.toLowerCase().includes(search.toLowerCase()) ||
      plugin.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Plugin Marketplace
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Discover and install Orchestra plugins
        </p>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search plugins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading plugins...</p>
        </div>
      ) : filteredPlugins.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 shadow rounded-lg">
          <span className="text-4xl">🔍</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No plugins found</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Try a different search term
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlugins.map((plugin) => (
            <div
              key={plugin.id}
              className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {plugin.name}
                    </h3>
                    {plugin.official && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        OFFICIAL
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {plugin.description}
                  </p>
                  <div className="mt-4">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      v{plugin.version} • {plugin.author}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {plugin.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs font-medium rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  className="w-full px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => alert(`Plugin "${plugin.id}" is already installed (built-in)`)}
                >
                  Installed
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
