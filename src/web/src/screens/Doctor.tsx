import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  version?: string;
  message: string;
  details?: string;
}

interface DoctorProps {
  onRefresh?: () => void;
}

export const Doctor: React.FC<DoctorProps> = ({ onRefresh }) => {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealthChecks = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error('Failed to fetch health checks');
      }
      
      const data = await response.json();
      setHealthChecks(data.checks || []);
    } catch (error) {
      console.error('Error fetching health checks:', error);
      setHealthChecks([
        {
          name: 'System Health',
          status: 'failed',
          message: 'Failed to perform health checks',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthChecks();
  }, []);

  const handleRefresh = () => {
    fetchHealthChecks(true);
    if (onRefresh) {
      onRefresh();
    }
  };

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: HealthCheck['status']) => {
    const styles = {
      passed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const passedCount = healthChecks.filter(c => c.status === 'passed').length;
  const failedCount = healthChecks.filter(c => c.status === 'failed').length;
  const warningCount = healthChecks.filter(c => c.status === 'warning').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Running system diagnostics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Diagnostics</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Verify your Orchestra environment is properly configured
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{passedCount}</p>
              <p className="text-sm text-green-600 dark:text-green-400">Passed</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{warningCount}</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Warnings</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{failedCount}</p>
              <p className="text-sm text-red-600 dark:text-red-400">Failed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Health Checks List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md divide-y divide-gray-200 dark:divide-gray-700">
        {healthChecks.map((check, index) => (
          <div key={index} className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(check.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {check.name}
                    </h4>
                    {getStatusBadge(check.status)}
                    {check.version && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        v{check.version}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mt-1">{check.message}</p>
                {check.details && (
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {check.details}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {healthChecks.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No health checks available</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-between">
        <a
          href="/settings"
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Go to Settings →
        </a>
        {failedCount > 0 && (
          <div className="text-sm text-red-600 dark:text-red-400">
            Some checks failed. Please review and fix the issues above.
          </div>
        )}
      </div>
    </div>
  );
};

export default Doctor;