import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { SessionHistory } from '../../utils/sessionHistory.js';
import { existsSync } from 'fs';
import { unlink, rm } from 'fs/promises';
import path from 'path';

interface SessionSummary {
  id: string;
  task: string;
  startTime: string;
  status: 'completed' | 'failed' | 'running' | 'cancelled';
  filesCreated: number;
  duration?: number;
}

interface HistoryProps {
  sessions: SessionSummary[];
  onSelect: (sessionId: string) => void;
  onSessionDetails: (sessionId: string) => void;
  onBack: () => void;
  onDelete: (sessionId: string) => void;
  onSessionsChange: () => void;
}

export const History: React.FC<HistoryProps> = ({
  sessions,
  onSelect,
  onSessionDetails,
  onBack,
  onDelete,
  onSessionsChange,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);

  const handleDeleteSession = async (sessionId: string) => {
    try {
      setDeleteStatus('Deleting...');

      // Delete session directory
      const sessionDir = path.join('.orchestra', 'sessions', sessionId);
      if (existsSync(sessionDir)) {
        await rm(sessionDir, { recursive: true, force: true });
      }

      // Remove from history index
      const history = new SessionHistory();
      await history.init();
      await history.deleteSession(sessionId);

      setDeleteStatus('Deleted!');
      onSessionsChange(); // Refresh sessions list
      onDelete(sessionId); // Notify parent

      setTimeout(() => {
        setDeleteStatus(null);
        setConfirmDelete(null);
      }, 1000);
    } catch (error) {
      setDeleteStatus('Failed: ' + String(error));
      setTimeout(() => {
        setDeleteStatus(null);
      }, 2000);
    }
  };

  useInput((input, key) => {
    if (key.escape) {
      if (confirmDelete) {
        setConfirmDelete(null);
        setDeleteStatus(null);
      } else {
        onBack();
      }
    }
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(sessions.length - 1, prev + 1));
    }
    if (key.return && sessions[selectedIndex]) {
      if (confirmDelete) {
        handleDeleteSession(confirmDelete);
      } else {
        onSessionDetails(sessions[selectedIndex].id);
      }
    }
    if (input === 'd' && sessions[selectedIndex] && !confirmDelete) {
      setConfirmDelete(sessions[selectedIndex].id);
    }
    if (input === 'v' && sessions[selectedIndex] && !confirmDelete) {
      onSessionDetails(sessions[selectedIndex].id);
    }
    if ((input === 'n' || input === 'c') && confirmDelete) {
      setConfirmDelete(null);
      setDeleteStatus(null);
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'running': return '🔄';
      case 'cancelled': return '⚠️';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'running': return 'yellow';
      case 'cancelled': return 'yellow';
      default: return 'gray';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().substring(0, 5);
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="double" borderColor="cyan" paddingX={2}>
        <Text bold color="cyan">📜 SESSION HISTORY</Text>
      </Box>

      {sessions.length === 0 ? (
        <Box marginTop={2}>
          <Text color="gray">No sessions found. Start a new task to create one!</Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {/* Header */}
          <Box borderStyle="single" borderColor="gray">
            <Box width={10}><Text bold color="white">ID</Text></Box>
            <Box width={8}><Text bold color="white">Status</Text></Box>
            <Box width={18}><Text bold color="white">Date</Text></Box>
            <Box width={10}><Text bold color="white">Duration</Text></Box>
            <Box width={6}><Text bold color="white">Files</Text></Box>
            <Box flexGrow={1}><Text bold color="white">Task</Text></Box>
          </Box>

          {/* Sessions */}
          {sessions.map((session, index) => (
            <Box
              key={session.id}
              backgroundColor={selectedIndex === index ? 'blue' : undefined}
            >
              <Box width={10}>
                <Text color={selectedIndex === index ? 'white' : 'cyan'}>
                  {session.id.substring(0, 8)}
                </Text>
              </Box>
              <Box width={8}>
                <Text color={getStatusColor(session.status)}>
                  {getStatusIcon(session.status)}
                </Text>
              </Box>
              <Box width={18}>
                <Text color="gray">{formatDate(session.startTime)}</Text>
              </Box>
              <Box width={10}>
                <Text color="white">{formatDuration(session.duration)}</Text>
              </Box>
              <Box width={6}>
                <Text color="green">{session.filesCreated}</Text>
              </Box>
              <Box flexGrow={1}>
                <Text color={selectedIndex === index ? 'white' : 'gray'}>
                  {session.task.substring(0, 40)}{session.task.length > 40 ? '...' : ''}
                </Text>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <Box
          marginTop={2}
          borderStyle="double"
          borderColor="red"
          padding={1}
          flexDirection="column"
        >
          <Text color="red">
            ⚠️ Delete session {confirmDelete.substring(0, 8)}?
          </Text>
          {deleteStatus ? (
            <Text color={deleteStatus === 'Deleted!' ? 'green' : 'red'}>
              {deleteStatus}
            </Text>
          ) : (
            <Text color="gray">
              Press y to confirm, n to cancel
            </Text>
          )}
        </Box>
      )}

      {/* Help */}
      <Box marginTop={2} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray">
          ↑/↓: Navigate │ Enter/v: View details │ d: Delete │ Esc: Back
        </Text>
      </Box>
    </Box>
  );
};
