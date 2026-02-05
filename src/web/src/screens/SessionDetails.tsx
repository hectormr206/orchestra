import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Box, Text } from 'ink';
import TabList from '../components/TabList';
import LogView from '../components/LogView';
import FileList from '../components/FileList';
import ProgressBar from '../components/ProgressBar';
import { api } from '../lib/api';

interface SessionDetailsProps {
  sessionId: string;
}

interface SessionDetails {
  sessionId: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  phases: Array<{
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    duration?: number;
  }>;
  files: Array<{
    path: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  }>;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>;
  metrics: {
    totalFiles: number;
    completedFiles: number;
    failedFiles: number;
    totalDuration: number;
  };
  plan?: string;
}

type TabType = 'overview' | 'logs' | 'files' | 'metrics';

export const SessionDetails: React.FC<SessionDetailsProps> = ({ sessionId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        setLoading(true);
        const details = await api.getSessionDetails(sessionId);
        setSession(details);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch session details');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
    
    // Refresh every 5 seconds if session is running
    const interval = setInterval(() => {
      if (session?.status === 'running') {
        fetchSessionDetails();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const handleResume = async () => {
    try {
      await api.resumeSession(sessionId);
      navigate('/execution');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume session');
    }
  };

  const handleExport = async () => {
    try {
      await api.exportSession(sessionId);
      // Show success message or trigger download
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export session');
    }
  };

  if (loading) {
    return (
      <Box flexDirection="column">
        <Text>Loading session details...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  if (!session) {
    return (
      <Box flexDirection="column">
        <Text>Session not found</Text>
      </Box>
    );
  }

  const renderOverview = () => (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column">
        <Text bold>Task</Text>
        <Text>{session.task}</Text>
      </Box>

      <Box flexDirection="column">
        <Text bold>Status</Text>
        <Text color={
          session.status === 'completed' ? 'green' :
          session.status === 'failed' ? 'red' :
          session.status === 'running' ? 'yellow' :
          'white'
        }>
          {session.status.toUpperCase()}
        </Text>
      </Box>

      <Box flexDirection="column">
        <Text bold>Duration</Text>
        <Text>
          {session.duration 
            ? `${Math.floor(session.duration / 60)}m ${session.duration % 60}s`
            : 'In progress'}
        </Text>
      </Box>

      {session.plan && (
        <Box flexDirection="column">
          <Text bold>Execution Plan</Text>
          <Text>{session.plan}</Text>
        </Box>
      )}

      <Box flexDirection="row" gap={2}>
        {session.status === 'failed' && (
          <Text color="yellow" onPress={handleResume}>[Resume]</Text>
        )}
        <Text color="blue" onPress={handleExport}>[Export]</Text>
        <Text color="blue" onPress={() => navigate('/history')}>[Back to History]</Text>
      </Box>
    </Box>
  );

  const renderLogs = () => (
    <Box flexDirection="column">
      <LogView logs={session.logs} />
    </Box>
  );

  const renderFiles = () => (
    <Box flexDirection="column">
      <FileList files={session.files} />
    </Box>
  );

  const renderMetrics = () => (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="row" justifyContent="spaceBetween">
        <Text bold>Total Files:</Text>
        <Text>{session.metrics.totalFiles}</Text>
      </Box>
      <Box flexDirection="row" justifyContent="spaceBetween">
        <Text bold>Completed:</Text>
        <Text color="green">{session.metrics.completedFiles}</Text>
      </Box>
      <Box flexDirection="row" justifyContent="spaceBetween">
        <Text bold>Failed:</Text>
        <Text color="red">{session.metrics.failedFiles}</Text>
      </Box>
      <Box flexDirection="row" justifyContent="spaceBetween">
        <Text bold>Success Rate:</Text>
        <Text>
          {session.metrics.totalFiles > 0
            ? `${((session.metrics.completedFiles / session.metrics.totalFiles) * 100).toFixed(1)}%`
            : '0%'}
        </Text>
      </Box>
      <Box flexDirection="row" justifyContent="spaceBetween">
        <Text bold>Total Duration:</Text>
        <Text>
          {Math.floor(session.metrics.totalDuration / 60)}m {session.metrics.totalDuration % 60}s
        </Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>Progress</Text>
        <ProgressBar 
          current={session.metrics.completedFiles} 
          total={session.metrics.totalFiles}
        />
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>Phases</Text>
        {session.phases.map((phase, index) => (
          <Box key={index} flexDirection="row" gap={2}>
            <Text width={20}>{phase.name}</Text>
            <Text color={
              phase.status === 'completed' ? 'green' :
              phase.status === 'failed' ? 'red' :
              phase.status === 'running' ? 'yellow' :
              'white'
            }>
              {phase.status}
            </Text>
            {phase.duration && (
              <Text>
                {Math.floor(phase.duration / 60)}m {phase.duration % 60}s
              </Text>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box flexDirection="column" height="100%">
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Session Details</Text>
        <Text dimColor>ID: {session.sessionId}</Text>
      </Box>

      <TabList
        tabs={['overview', 'logs', 'files', 'metrics']}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabType)}
      />

      <Box flexGrow={1} marginTop={1}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'logs' && renderLogs()}
        {activeTab === 'files' && renderFiles()}
        {activeTab === 'metrics' && renderMetrics()}
      </Box>
    </Box>
  );
};

export default SessionDetails;