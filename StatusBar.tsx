import React from 'react';
import { Box, Text } from 'ink';
import { truncateText } from '../../utils/text';

interface StatusBarProps {
  status: 'idle' | 'planning' | 'executing' | 'auditing' | 'complete' | 'error';
  sessionId?: string;
  currentFile?: string;
  progress?: { current: number; total: number };
}

const MAX_FILE_LENGTH = 40;
const MAX_SESSION_ID_LENGTH = 8;

const formatProgress = (current: number, total: number): string => {
  const maxDigits = Math.max(String(current).length, String(total).length);
  const currentStr = String(current).padStart(maxDigits, '0');
  const totalStr = String(total).padStart(maxDigits, '0');
  return `[${currentStr}/${totalStr}]`;
};

export const StatusBar: React.FC<StatusBarProps> = ({
  status,
  sessionId,
  currentFile,
  progress,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'idle': return 'gray';
      case 'planning': return 'blue';
      case 'executing': return 'yellow';
      case 'auditing': return 'magenta';
      case 'complete': return 'green';
      case 'error': return 'red';
      default: return 'white';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'idle': return '◯';
      case 'planning': return '📝';
      case 'executing': return '⚡';
      case 'auditing': return '🔍';
      case 'complete': return '✅';
      case 'error': return '❌';
      default: return '?';
    }
  };

  return (
    <Box
      borderStyle="single"
      borderColor={getStatusColor()}
      paddingX={1}
      justifyContent="space-between"
      width="100%"
    >
      <Box flexGrow={1} flexShrink={1}>
        <Text color={getStatusColor()}>
          {getStatusIcon()} {status.toUpperCase()}
        </Text>
        {currentFile && (
          <Text color="gray"> │ {truncateText(currentFile, MAX_FILE_LENGTH)}</Text>
        )}
      </Box>
      <Box flexGrow={0} flexShrink={0}>
        {progress && (
          <Text color="cyan" dimColor={!progress.total}>
            {formatProgress(progress.current, progress.total)}
          </Text>
        )}
        {sessionId && (
          <Text color="gray"> │ Session: {truncateText(sessionId, MAX_SESSION_ID_LENGTH)}</Text>
        )}
      </Box>
    </Box>
  );
};