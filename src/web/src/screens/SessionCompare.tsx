/**
 * Session Comparison - Web UI
 * Compara dos sesiones lado a lado con diff visual
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

interface FileDiff {
  path: string;
  inA: boolean;
  inB: boolean;
  statusChanged: boolean;
  oldStatus?: string;
  newStatus?: string;
}

interface MetricsDelta {
  durationDelta: number;
  durationPercent: number;
  iterationsDelta: number;
  filesCreatedDelta: number;
}

interface ComparisonResult {
  sessionA: any;
  sessionB: any;
  planDiff: DiffLine[];
  fileDifferences: FileDiff[];
  metricsDelta: MetricsDelta;
  success: boolean;
}

const API_BASE = 'http://localhost:3001/api';

export default function SessionCompare() {
  const [searchParams] = useSearchParams();
  const sessionAId = searchParams.get('sessionA');
  const sessionBId = searchParams.get('sessionB');

  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'metrics' | 'plan' | 'files'>('metrics');

  useEffect(() => {
    if (sessionAId && sessionBId) {
      loadComparison();
    }
  }, [sessionAId, sessionBId]);

  const loadComparison = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionAId, sessionBId })
      });

      const data = await response.json();
      setComparison(data.comparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading comparison');
      console.error('Comparison error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getDeltaColor = (delta: number): string => {
    if (delta > 0) return 'text-red-600';
    if (delta < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getDiffLineClass = (type: DiffLine['type']): string => {
    switch (type) {
      case 'added':
        return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-800 dark:text-green-300';
      case 'removed':
        return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-300';
      default:
        return 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const getDiffPrefix = (type: DiffLine['type']): string => {
    switch (type) {
      case 'added': return '+ ';
      case 'removed': return '- ';
      default: return '  ';
    }
  };

  if (!sessionAId || !sessionBId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please select two sessions to compare</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error || 'Failed to load comparison'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🆚 Session Comparison
        </h1>
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">A:</span>
            <code className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-300 rounded">
              {comparison.sessionA.id.substring(0, 12)}
            </code>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">B:</span>
            <code className="px-2 py-1 bg-magenta-100 dark:bg-magenta-900 text-magenta-800 dark:text-magenta-300 rounded">
              {comparison.sessionB.id.substring(0, 12)}
            </code>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {(['metrics', 'plan', 'files'] as const).map((tab) => (
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

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'metrics' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📊 Metrics Delta
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Duration */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Duration
                </h3>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-2xl font-bold ${getDeltaColor(comparison.metricsDelta.durationDelta)}`}>
                    {comparison.metricsDelta.durationDelta > 0 ? '+' : ''}
                    {formatDuration(Math.abs(comparison.metricsDelta.durationDelta))}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({comparison.metricsDelta.durationPercent > 0 ? '+' : ''}
                    {comparison.metricsDelta.durationPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Iterations */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Iterations
                </h3>
                <span className={`text-2xl font-bold ${getDeltaColor(comparison.metricsDelta.iterationsDelta)}`}>
                  {comparison.metricsDelta.iterationsDelta > 0 ? '+' : ''}
                  {comparison.metricsDelta.iterationsDelta}
                </span>
              </div>

              {/* Files Created */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Files Created
                </h3>
                <span className={`text-2xl font-bold ${getDeltaColor(-comparison.metricsDelta.filesCreatedDelta)}`}>
                  {comparison.metricsDelta.filesCreatedDelta > 0 ? '+' : ''}
                  {comparison.metricsDelta.filesCreatedDelta}
                </span>
              </div>
            </div>

            {/* Task Comparison */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Task Comparison
              </h3>
              <div className="space-y-2">
                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded">
                  <span className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold">A:</span>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">
                    {comparison.sessionA.task.substring(0, 100)}
                    {comparison.sessionA.task.length > 100 && '...'}
                  </p>
                </div>
                <div className="p-3 bg-magenta-50 dark:bg-magenta-900/20 rounded">
                  <span className="text-xs text-magenta-600 dark:text-magenta-400 font-semibold">B:</span>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">
                    {comparison.sessionB.task.substring(0, 100)}
                    {comparison.sessionB.task.length > 100 && '...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📝 Plan Diff
            </h2>

            {comparison.planDiff.length === 0 ? (
              <p className="text-gray-500">Plans are identical</p>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <div className="font-mono text-sm space-y-1">
                  {comparison.planDiff.map((line, idx) => (
                    <div key={idx} className={`px-2 py-1 ${getDiffLineClass(line.type)}`}>
                      <span className="select-none opacity-50">{getDiffPrefix(line.type)}</span>
                      {line.content.substring(0, 120)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📁 File Differences
            </h2>

            {comparison.fileDifferences.length === 0 ? (
              <p className="text-gray-500">No file differences</p>
            ) : (
              <div className="space-y-2">
                {comparison.fileDifferences.map((diff, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      !diff.inA && diff.inB
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : diff.inA && !diff.inB
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : diff.statusChanged
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2 font-mono text-sm">
                      {!diff.inA && diff.inB && (
                        <span className="text-green-600 font-bold">+</span>
                      )}
                      {diff.inA && !diff.inB && (
                        <span className="text-red-600 font-bold">-</span>
                      )}
                      {diff.statusChanged && (
                        <span className="text-yellow-600 font-bold">~</span>
                      )}
                      <span className="text-gray-800 dark:text-gray-200">{diff.path}</span>
                      {diff.statusChanged && (
                        <span className="text-xs text-gray-500">
                          ({diff.oldStatus} → {diff.newStatus})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
