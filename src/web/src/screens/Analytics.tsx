/**
 * Analytics Dashboard - Web UI
 * Muestra tendencias, performance de agentes y errores frecuentes
 */

import { useState, useEffect } from 'react';

interface TrendData {
  period: string;
  total: number;
  completed: number;
  failed: number;
  successRate: number;
  avgDuration: number;
  totalCost: number;
}

interface AgentStats {
  agentRole: string;
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  avgLatencyMs: number;
  totalCost: number;
}

interface ErrorFrequency {
  errorMessage: string;
  count: number;
  affectedSessions: string[];
}

const API_BASE = 'http://localhost:3001/api';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [topErrors, setTopErrors] = useState<ErrorFrequency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [trendsRes, agentsRes, errorsRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/trends?range=${timeRange}&groupBy=week`),
        fetch(`${API_BASE}/analytics/agents?range=${timeRange}`),
        fetch(`${API_BASE}/analytics/errors?range=${timeRange}&limit=10`)
      ]);

      const trendsData = await trendsRes.json();
      const agentsData = await agentsRes.json();
      const errorsData = await errorsRes.json();

      setTrends(trendsData.trends || []);
      setAgentStats(agentsData.agentStats || []);
      setTopErrors(errorsData.errors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading analytics');
      console.error('Analytics error:', err);
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

  const getSuccessRateColor = (rate: number): string => {
    if (rate > 0.8) return 'text-green-600';
    if (rate > 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={loadAnalytics}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          📊 Analytics Dashboard
        </h1>

        {/* Time Range Selector */}
        <div className="flex space-x-2">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Success Rate Trends */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📈 Success Rate Trends
        </h2>

        {trends.length === 0 ? (
          <p className="text-gray-500">No trend data available</p>
        ) : (
          <div className="space-y-3">
            {trends.slice(-8).map((trend, idx) => (
              <div key={idx} className="flex items-center space-x-4">
                <div className="w-24 text-sm text-gray-600 dark:text-gray-400">
                  {trend.period}
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full flex items-center justify-center text-xs font-semibold text-white ${
                          trend.successRate > 0.8
                            ? 'bg-green-600'
                            : trend.successRate > 0.5
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${trend.successRate * 100}%` }}
                      >
                        {(trend.successRate * 100).toFixed(1)}%
                      </div>
                    </div>
                    <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                      {trend.completed}/{trend.total}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Avg: {formatDuration(trend.avgDuration)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🤖 Agent Performance
        </h2>

        {agentStats.length === 0 ? (
          <p className="text-gray-500">No agent data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Avg Latency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Attempts
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {agentStats.map((agent) => (
                  <tr key={agent.agentRole} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {agent.agentRole}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getSuccessRateColor(agent.successRate)}`}>
                        {(agent.successRate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {agent.avgLatencyMs.toFixed(0)}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      ${agent.totalCost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {agent.totalAttempts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Errors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ⚠️ Top Errors (Frequency)
        </h2>

        {topErrors.length === 0 ? (
          <p className="text-green-600 dark:text-green-400">No errors found 🎉</p>
        ) : (
          <div className="space-y-4">
            {topErrors.slice(0, 5).map((error, idx) => (
              <div
                key={idx}
                className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20"
              >
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-red-600 text-white rounded-full font-bold text-sm">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                        {error.count}x
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-red-800 dark:text-red-300 font-mono">
                      {error.errorMessage.substring(0, 100)}
                      {error.errorMessage.length > 100 && '...'}
                    </p>
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      Affected {error.affectedSessions.length} session(s)
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
