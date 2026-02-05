import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useOrchestration } from '../hooks/useOrchestration';
import ProgressBar from './ui/ProgressBar';
import LogViewer from './ui/LogViewer';
import FileList from './ui/FileList';
import AgentStatus from './ui/AgentStatus';
import DurationDisplay from './ui/DurationDisplay';
import { ExecutionPhase, LogEntry, FileStatus, AgentInfo } from '../types';

interface ExecutionProps {
  apiBaseUrl: string;
  wsBaseUrl: string;
}

const Execution: React.FC<ExecutionProps> = ({ apiBaseUrl, wsBaseUrl }) => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const logContainerRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    lastMessage,
    error: wsError,
  } = useWebSocket(wsBaseUrl, sessionId);

  const {
    phase,
    progress,
    currentAgent,
    agents,
    logs,
    files,
    task,
    startTime,
    cancelExecution,
    approvePlan,
  } = useOrchestration(apiBaseUrl, sessionId, lastMessage);

  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedLogLevel, setSelectedLogLevel] = useState<'all' | 'info' | 'warning' | 'error'>('all');

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this execution?')) {
      await cancelExecution();
      navigate('/dashboard');
    }
  };

  const handleApprove = async () => {
    await approvePlan();
  };

  const filteredLogs = logs.filter(log => {
    if (selectedLogLevel === 'all') return true;
    return log.level === selectedLogLevel;
  });

  const completedFiles = files.filter(f => f.status === 'completed').length;
  const failedFiles = files.filter(f => f.status === 'failed').length;
  const totalFiles = files.length;

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid Session</h2>
          <p className="text-gray-400 mb-4">No session ID provided</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-semibold truncate">{task || 'Orchestra Execution'}</h1>
            <p className="text-sm text-gray-400 mt-1">Session: {sessionId}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`} />
              {isConnected ? 'Live' : 'Disconnected'}
            </div>
            {phase !== 'completed' && phase !== 'failed' && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Status */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          {/* Phase Badge */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Current Phase
            </h3>
            <div className={`px-4 py-2 rounded-lg font-medium text-center ${
              phase === 'completed' ? 'bg-green-900 text-green-300' :
              phase === 'failed' ? 'bg-red-900 text-red-300' :
              phase === 'planning' ? 'bg-blue-900 text-blue-300' :
              phase === 'approving' ? 'bg-yellow-900 text-yellow-300' :
              'bg-purple-900 text-purple-300'
            }`}>
              {phase.charAt(0).toUpperCase() + phase.slice(1)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Progress
            </h3>
            <ProgressBar progress={progress} />
            <p className="text-xs text-gray-400 mt-2 text-center">
              {completedFiles} / {totalFiles} files completed
              {failedFiles > 0 && ` • ${failedFiles} failed`}
            </p>
          </div>

          {/* Duration */}
          {startTime && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Duration
              </h3>
              <DurationDisplay startTime={startTime} />
            </div>
          )}

          {/* Current Agent */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Active Agent
            </h3>
            {currentAgent ? (
              <AgentStatus agent={currentAgent} isActive />
            ) : (
              <p className="text-gray-500 text-sm">No active agent</p>
            )}
          </div>

          {/* All Agents */}
          {agents && agents.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Agent Chain
              </h3>
              <div className="space-y-2">
                {agents.map((agent, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className={index === agents.findIndex(a => a.name === currentAgent?.name) ? 'text-blue-400' : 'text-gray-500'}>
                      {agent.name}
                    </span>
                    {index < agents.length - 1 && (
                      <span className="text-gray-600">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan Approval Section */}
          {phase === 'approving' && (
            <div className="mt-6 p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
              <h3 className="text-sm font-semibold text-yellow-300 mb-2">
                Plan Approval Required
              </h3>
              <p className="text-xs text-gray-300 mb-3">
                Review the generated plan before proceeding
              </p>
              <div className="space-y-2">
                <button
                  onClick={handleApprove}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm font-medium"
                >
                  Approve Plan
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-medium"
                >
                  Reject Plan
                </button>
              </div>
            </div>
          )}

          {/* WS Error */}
          {wsError && (
            <div className="mt-6 p-3 bg-red-900 border border-red-700 rounded-lg">
              <p className="text-xs text-red-300">WebSocket Error: {wsError.message}</p>
            </div>
          )}
        </div>

        {/* Right Panel - Logs and Files */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="bg-gray-800 border-b border-gray-700 px-4 flex items-center gap-4">
            <button className="px-4 py-3 text-sm font-medium text-blue-400 border-b-2 border-blue-400">
              Logs & Files
            </button>
          </div>

          {/* Log Controls */}
          <div className="bg-gray-850 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-400">Auto-scroll</span>
              </label>
              <select
                value={selectedLogLevel}
                onChange={(e) => setSelectedLogLevel(e.target.value as any)}
                className="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="text-sm text-gray-400">
              {filteredLogs.length} entries
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Files Panel */}
            <div className="w-80 bg-gray-850 border-r border-gray-700 p-4 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Files ({totalFiles})
              </h3>
              <FileList files={files} />
            </div>

            {/* Logs Panel */}
            <div className="flex-1 bg-gray-900 p-4 overflow-hidden flex flex-col">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Execution Logs
              </h3>
              <div
                ref={logContainerRef}
                className="flex-1 overflow-y-auto"
              >
                <LogViewer logs={filteredLogs} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Execution;