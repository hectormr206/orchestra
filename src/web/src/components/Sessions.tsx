import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';

interface Session {
  sessionId: string;
  status: string;
  task: string;
  startTime: number;
  endTime?: number;
  clientCount: number;
}

export default function Sessions() {
  const { sessionId } = useParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const result = await api.listSessions();
      setSessions(result.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this session?')) return;

    try {
      await api.cancelSession(id);
      loadSessions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel session');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sessions
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View and manage orchestration sessions
          </p>
        </div>
        <button
          onClick={loadSessions}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 shadow rounded-lg">
          <span className="text-4xl">📭</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No sessions</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Start an orchestration task to see it here
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {sessions.map((session) => (
              <li key={session.sessionId}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                          {session.sessionId}
                        </p>
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {session.task}
                      </p>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                        Started: {new Date(session.startTime).toLocaleString()}
                        {session.endTime && (
                          <> • Ended: {new Date(session.endTime).toLocaleString()}</>
                        )}
                      </div>
                    </div>
                    {session.status === 'running' && (
                      <button
                        onClick={() => handleCancel(session.sessionId)}
                        className="ml-4 px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
