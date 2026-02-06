/**
 * Session Details - Web UI
 * Vista detallada de una sesión con tabs y export functionality
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Download, RefreshCw, Clock, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface SessionDetailsData {
  id: string;
  task: string;
  startTime: string;
  endTime?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  plan?: string;
  files: Array<{
    path: string;
    description?: string;
    status: string;
    content?: string;
  }>;
  iterations: Array<{
    number: number;
    agent: string;
    adapter: string;
    startTime: string;
    endTime?: string;
    success: boolean;
  }>;
  metrics?: {
    totalDuration: number;
    architectDuration: number;
    executorDuration: number;
    auditorDuration: number;
    filesCreated: number;
    filesFailed: number;
    iterations: number;
    fallbacks: number;
  };
  logs?: Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>;
}

const API_BASE = 'http://localhost:3001/api';

export default function SessionDetailsWeb() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<SessionDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'files' | 'logs' | 'iterations'>('overview');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/sessions/${sessionId}`);
      const data = await response.json();
      setSession(data.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json' | 'html' | 'markdown') => {
    if (!sessionId) return;

    try {
      setExporting(true);
      const response = await fetch(`${API_BASE}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, format })
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${sessionId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setShowExportMenu(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export session');
    } finally {
      setExporting(false);
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'failed':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'running':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error || 'Session not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/history')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Session Details
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadSession}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowExportMenu(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Session Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Session ID</p>
              <p className="text-sm font-mono text-gray-900 dark:text-white">{session.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(session.status)}`}>
                {session.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Started</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {format(new Date(session.startTime), 'MMM d, yyyy HH:mm:ss')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Duration</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {session.metrics ? formatDuration(session.metrics.totalDuration) : 'N/A'}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Task</p>
            <p className="text-gray-900 dark:text-white">{session.task}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {(['overview', 'plan', 'files', 'logs', 'iterations'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {activeTab === 'overview' && session.metrics && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📊 Metrics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Files Created</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {session.metrics.filesCreated}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Files Failed</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {session.metrics.filesFailed}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Iterations</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {session.metrics.iterations}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fallbacks</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {session.metrics.fallbacks}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Duration Breakdown
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Architect:</span>
                  <span className="font-medium">{formatDuration(session.metrics.architectDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Executor:</span>
                  <span className="font-medium">{formatDuration(session.metrics.executorDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Auditor:</span>
                  <span className="font-medium">{formatDuration(session.metrics.auditorDuration)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📝 Execution Plan
            </h2>
            {session.plan ? (
              <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {session.plan}
              </pre>
            ) : (
              <p className="text-gray-500">No plan available</p>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📁 Generated Files ({session.files.length})
            </h2>
            <div className="space-y-2">
              {session.files.map((file, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-mono text-sm text-gray-900 dark:text-white">
                        {file.path}
                      </p>
                      {file.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {file.description}
                        </p>
                      )}
                    </div>
                    <span className={`ml-4 px-2 py-1 text-xs rounded ${
                      file.status === 'created' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      file.status === 'modified' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {file.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📄 Logs
            </h2>
            {session.logs && session.logs.length > 0 ? (
              <div className="space-y-1">
                {session.logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-sm font-mono ${
                      log.level === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                      log.level === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' :
                      'bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-gray-500">[{format(new Date(log.timestamp), 'HH:mm:ss')}]</span>{' '}
                    <span className="font-semibold">{log.level.toUpperCase()}:</span>{' '}
                    {log.message}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No logs available</p>
            )}
          </div>
        )}

        {activeTab === 'iterations' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🔄 Iterations ({session.iterations.length})
            </h2>
            <div className="space-y-3">
              {session.iterations.map((iter, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        #{iter.number}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {iter.agent}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                        {iter.adapter}
                      </span>
                    </div>
                    {iter.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(iter.startTime), 'HH:mm:ss')}
                    </div>
                    {iter.endTime && (
                      <span>
                        Duration: {formatDuration(
                          new Date(iter.endTime).getTime() - new Date(iter.startTime).getTime()
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Export Menu Modal */}
      {showExportMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Export Session
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Choose export format:
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50 text-left flex items-center justify-between"
              >
                <span className="font-medium">CSV</span>
                <span className="text-sm text-gray-500">Spreadsheet format</span>
              </button>
              <button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50 text-left flex items-center justify-between"
              >
                <span className="font-medium">JSON</span>
                <span className="text-sm text-gray-500">Machine-readable</span>
              </button>
              <button
                onClick={() => handleExport('html')}
                disabled={exporting}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50 text-left flex items-center justify-between"
              >
                <span className="font-medium">HTML</span>
                <span className="text-sm text-gray-500">Web page</span>
              </button>
              <button
                onClick={() => handleExport('markdown')}
                disabled={exporting}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50 text-left flex items-center justify-between"
              >
                <span className="font-medium">Markdown</span>
                <span className="text-sm text-gray-500">Documentation format</span>
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowExportMenu(false)}
                disabled={exporting}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
